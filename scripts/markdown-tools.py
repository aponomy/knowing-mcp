#!/usr/bin/env python3
"""
Markdown Tools for knowing-mcp
Deterministic, Markdown-aware editing tools for MCP

INDEXING SEMANTICS:
- Lines: 1-based (first line is 1)
- Columns: 1-based (first character is 1)
- Units: Unicode code points
- Ranges: Half-open [start, end) - end position is exclusive

REGEX ENGINE:
- Engine: Python re module (compatible with PCRE)
- Default flags: caseSensitive=true, multiline=true
- Supported flags: i (ignore case), m (multiline), s (dotall)

MARKDOWN FLAVOR:
- CommonMark + GFM (GitHub Flavored Markdown)
- Front matter: YAML only (between --- markers)
- Code blocks: Fenced (```) and indented (4 spaces)
"""

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

# Check dependencies
try:
    from markdown_it import MarkdownIt
    from markdown_it.token import Token
except ImportError:
    print(json.dumps({
        "ok": False,
        "error": "markdown-it-py not installed. Run: pip install markdown-it-py"
    }))
    sys.exit(1)

# Optional dependencies
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False

try:
    import mdformat
    from mdformat import _cli
    MDFORMAT_AVAILABLE = True
except ImportError:
    MDFORMAT_AVAILABLE = False


class ErrorCode(Enum):
    """Error codes for markdown operations"""
    PRECONDITION_FAILED = "PRECONDITION_FAILED"
    NO_MATCH = "NO_MATCH"
    AMBIGUOUS_MATCH = "AMBIGUOUS_MATCH"
    OUT_OF_RANGE = "OUT_OF_RANGE"
    MARKDOWN_BROKEN = "MARKDOWN_BROKEN"
    MARKDOWN_LINT_ERROR = "MARKDOWN_LINT_ERROR"
    IO_ERROR = "IO_ERROR"
    ENCODING_ERROR = "ENCODING_ERROR"
    CONFLICTING_EDITS = "CONFLICTING_EDITS"
    INVALID_OPERATION = "INVALID_OPERATION"
    # Phase 1 additions
    INVALID_HEADING_PATH = "INVALID_HEADING_PATH"
    AMBIGUOUS_HEADING = "AMBIGUOUS_HEADING"
    SECTION_NOT_FOUND = "SECTION_NOT_FOUND"
    FRONT_MATTER_NOT_FOUND = "FRONT_MATTER_NOT_FOUND"
    FORMATTER_FAILED = "FORMATTER_FAILED"
    INVALID_REGEX = "INVALID_REGEX"


@dataclass
class Position:
    """1-based line and column position (Unicode code points)"""
    line: int  # 1-based
    col: int   # 1-based


@dataclass
class Range:
    """Range in document"""
    start: Position
    end: Position


@dataclass
class Diagnostic:
    """Lint/validation diagnostic"""
    severity: str  # "error", "warning", "info"
    code: Optional[str]
    message: str
    line: Optional[int] = None
    col: Optional[int] = None
    source: Optional[str] = None


@dataclass
class Section:
    """Markdown section metadata"""
    heading_path: List[str]
    canonical_heading_path: List[str]  # Normalized for matching
    section_id: str  # Stable hash-based ID
    level: int
    start_line: int
    end_line: int
    heading_line: int


@dataclass
@dataclass
class Match:
    """Represents a match found during replace operations"""
    line: int  # 1-based
    col: int   # 1-based
    text: str
    start_pos: Position
    end_pos: Position


@dataclass
class CodeBlock:
    """Fenced code block metadata"""
    start_line: int
    end_line: int
    info_string: str
    language: Optional[str]


@dataclass
class TableInfo:
    """GFM table metadata"""
    start_line: int
    end_line: int
    section: Optional[List[str]]


def normalize_heading(text: str) -> str:
    """
    Normalize heading text for canonical matching.
    
    Rules:
    - Lowercase
    - Remove inline code, emphasis markers, emojis
    - Collapse whitespace
    - Strip punctuation except hyphens
    - Remove leading/trailing whitespace
    """
    # Remove inline code backticks
    text = re.sub(r'`([^`]+)`', r'\1', text)
    
    # Remove emphasis markers (*, _, ~)
    text = re.sub(r'[*_~]+', '', text)
    
    # Remove emojis and special characters (keep letters, numbers, spaces, hyphens)
    text = re.sub(r'[^\w\s-]', '', text, flags=re.UNICODE)
    
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Lowercase and strip
    return text.lower().strip()


def create_section_id(heading_path: List[str], line: int) -> str:
    """Create a stable section ID from heading path and line number"""
    path_str = '/'.join(heading_path)
    id_input = f"{path_str}:{line}"
    return hashlib.sha256(id_input.encode('utf-8')).hexdigest()[:16]


def convert_to_1_based(line: int, col: int = 0) -> Tuple[int, int]:
    """Convert 0-based to 1-based indexing"""
    return (line + 1, col + 1)


def convert_to_0_based(line: int, col: int = 0) -> Tuple[int, int]:
    """Convert 1-based to 0-based indexing"""
    return (max(0, line - 1), max(0, col - 1))


class MarkdownDocument:
    """Represents a markdown document with structural information"""
    
    def __init__(self, file_path: str):
        self.file_path = Path(file_path)
        self.encoding = None
        self.eol = None
        self.content = None
        self.lines: List[str] = []
        self.sha256 = None
        self.sections: List[Section] = []
        self.code_blocks: List[CodeBlock] = []
        self.tables: List[TableInfo] = []
        self.front_matter: Optional[Dict[str, Any]] = None
        self.front_matter_lines: Optional[Tuple[int, int]] = None
        
    def load(self) -> bool:
        """Load and analyze the document"""
        try:
            # Detect encoding
            raw_bytes = self.file_path.read_bytes()
            
            # Try UTF-8 first (with or without BOM)
            if raw_bytes.startswith(b'\xef\xbb\xbf'):
                self.encoding = 'utf-8-sig'
                self.content = raw_bytes[3:].decode('utf-8')
            else:
                try:
                    self.content = raw_bytes.decode('utf-8')
                    self.encoding = 'utf-8'
                except UnicodeDecodeError:
                    # Fallback to latin-1
                    self.content = raw_bytes.decode('latin-1')
                    self.encoding = 'latin-1'
            
            # Detect line endings
            if '\r\n' in self.content:
                self.eol = 'CRLF'
                self.lines = self.content.split('\r\n')
            else:
                self.eol = 'LF'
                self.lines = self.content.split('\n')
            
            # Calculate SHA-256
            self.sha256 = hashlib.sha256(raw_bytes).hexdigest()
            
            # Parse structure
            self._parse_structure()
            
            return True
            
        except Exception as e:
            raise IOError(f"Failed to load file: {e}")
    
    def _parse_structure(self):
        """Parse document structure using markdown-it-py"""
        md = MarkdownIt()
        tokens = md.parse(self.content)
        
        # Extract front matter if present
        if self.content.startswith('---\n') or self.content.startswith('---\r\n'):
            self._extract_front_matter()
        
        # Build heading hierarchy
        heading_stack: List[Tuple[int, str, int]] = []  # (level, text, line)
        current_section_start = 0
        
        for i, token in enumerate(tokens):
            if token.type == 'heading_open':
                level = int(token.tag[1])  # h1 -> 1, h2 -> 2, etc.
                
                # Get heading text from next token
                if i + 1 < len(tokens) and tokens[i + 1].type == 'inline':
                    text = tokens[i + 1].content
                    line = token.map[0] if token.map else 0
                    
                    # Close sections for headings that are ending
                    while heading_stack and heading_stack[-1][0] >= level:
                        closing_level, closing_text, closing_line = heading_stack.pop()
                        # Build path from remaining stack + the closing heading
                        ancestors = [h[1] for h in heading_stack]
                        heading_path = ancestors + [closing_text]
                        canonical_path = [normalize_heading(h) for h in heading_path]
                        section_id = create_section_id(heading_path, closing_line)
                        
                        section = Section(
                            heading_path=heading_path,
                            canonical_heading_path=canonical_path,
                            section_id=section_id,
                            level=closing_level,
                            start_line=closing_line,
                            end_line=line - 1,
                            heading_line=closing_line
                        )
                        self.sections.append(section)
                    
                    # Add new heading to stack
                    heading_stack.append((level, text, line))
            
            elif token.type == 'fence':
                # Extract code block info
                if token.map:
                    code_block = CodeBlock(
                        start_line=token.map[0],
                        end_line=token.map[1],
                        info_string=token.info or '',
                        language=token.info.split()[0] if token.info else None
                    )
                    self.code_blocks.append(code_block)
            
            elif token.type == 'table_open':
                # Find table extent
                if token.map:
                    # Determine which section this table is in
                    table_section = None
                    for section in self.sections:
                        if section.start_line <= token.map[0] <= section.end_line:
                            table_section = section.heading_path
                            break
                    
                    table = TableInfo(
                        start_line=token.map[0],
                        end_line=token.map[1],
                        section=table_section
                    )
                    self.tables.append(table)
        
        # Add final sections for any remaining headings on stack
        while heading_stack:
            closing_level, closing_text, closing_line = heading_stack.pop()
            ancestors = [h[1] for h in heading_stack]
            heading_path = ancestors + [closing_text]
            canonical_path = [normalize_heading(h) for h in heading_path]
            section_id = create_section_id(heading_path, closing_line)
            section = Section(
                heading_path=heading_path,
                canonical_heading_path=canonical_path,
                section_id=section_id,
                level=closing_level,
                start_line=closing_line,
                end_line=len(self.lines) - 1,
                heading_line=closing_line
            )
            self.sections.append(section)
    
    def _extract_front_matter(self):
        """Extract YAML front matter"""
        if not YAML_AVAILABLE:
            return
        
        lines = self.lines
        if not (lines[0] == '---' or lines[0] == '---\r'):
            return
        
        # Find closing ---
        for i in range(1, min(len(lines), 50)):  # Limit search to first 50 lines
            if lines[i].strip() == '---':
                try:
                    fm_text = '\n'.join(lines[1:i])
                    self.front_matter = yaml.safe_load(fm_text)
                    self.front_matter_lines = (0, i)
                    return
                except yaml.YAMLError:
                    return
    
    def get_section_by_path(self, heading_path: List[str], include_subsections: bool = False) -> Tuple[Optional[Section], Optional[str]]:
        """
        Find section by heading path.
        
        Returns: (section, error_code)
        - (section, None) if found uniquely
        - (None, "AMBIGUOUS_HEADING") if multiple matches
        - (None, "SECTION_NOT_FOUND") if no match
        """
        matches = []
        
        # Normalize the search path for comparison
        normalized_search_path = [normalize_heading(h) for h in heading_path]
        
        for section in self.sections:
            # Try exact match first
            if section.heading_path == heading_path:
                matches.append(section)
                continue
            
            # Try normalized match
            if section.canonical_heading_path == normalized_search_path:
                matches.append(section)
                continue
            
            # Check for subsection match
            if include_subsections and len(section.canonical_heading_path) > len(normalized_search_path):
                if section.canonical_heading_path[:len(normalized_search_path)] == normalized_search_path:
                    matches.append(section)
        
        if len(matches) == 0:
            return (None, ErrorCode.SECTION_NOT_FOUND.value)
        elif len(matches) > 1:
            return (None, ErrorCode.AMBIGUOUS_HEADING.value)
        else:
            return (matches[0], None)
    
    def get_section_by_id(self, section_id: str) -> Optional[Section]:
        """Find section by stable section ID"""
        for section in self.sections:
            if section.section_id == section_id:
                return section
        return None
    
    def is_in_code_block(self, line: int) -> bool:
        """Check if line is inside a code block"""
        for block in self.code_blocks:
            if block.start_line <= line < block.end_line:
                return True
        return False
    
    def is_in_table(self, line: int) -> bool:
        """Check if line is inside a table"""
        for table in self.tables:
            if table.start_line <= line < table.end_line:
                return True
        return False
    
    def validate_fences(self) -> List[Diagnostic]:
        """Validate that code fences are balanced"""
        diagnostics = []
        fence_stack = []
        
        for i, line in enumerate(self.lines):
            stripped = line.strip()
            if stripped.startswith('```') or stripped.startswith('~~~'):
                fence_char = stripped[0]
                if not fence_stack or fence_stack[-1] != fence_char:
                    fence_stack.append(fence_char)
                else:
                    fence_stack.pop()
        
        if fence_stack:
            diagnostics.append(Diagnostic(
                severity="error",
                code="UNBALANCED_FENCE",
                message=f"Unbalanced code fence ({len(fence_stack)} unclosed)",
                source="validator"
            ))
        
        return diagnostics


class MarkdownEditor:
    """Applies edits to markdown documents"""
    
    def __init__(self, doc: MarkdownDocument):
        self.doc = doc
        self.buffer = list(doc.lines)
        self.diagnostics: List[Diagnostic] = []
        self.matches: List[Match] = []
    
    def apply_edit(self, edit: Dict[str, Any]) -> bool:
        """Apply a single edit operation"""
        op = edit.get('op')
        
        if op == 'replace_range':
            return self._apply_replace_range(edit)
        elif op == 'replace_match':
            return self._apply_replace_match(edit)
        elif op == 'replace_section':
            return self._apply_replace_section(edit)
        elif op == 'insert_after_heading':
            return self._apply_insert_after_heading(edit)
        elif op == 'update_front_matter':
            return self._apply_update_front_matter(edit)
        else:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.INVALID_OPERATION.value,
                message=f"Unknown operation: {op}",
                source="editor"
            ))
            return False
    
    def _apply_replace_range(self, edit: Dict[str, Any]) -> bool:
        """Replace text in a specific range"""
        range_data = edit['range']
        replacement = edit['replacement']
        expected_text = edit.get('expectedText')
        
        start = Position(range_data['start']['line'], range_data['start']['col'])
        end = Position(range_data['end']['line'], range_data['end']['col'])
        
        # Validate range
        if start.line < 0 or start.line >= len(self.buffer):
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.OUT_OF_RANGE.value,
                message=f"Start line {start.line} out of range",
                line=start.line,
                source="editor"
            ))
            return False
        
        if end.line < 0 or end.line >= len(self.buffer):
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.OUT_OF_RANGE.value,
                message=f"End line {end.line} out of range",
                line=end.line,
                source="editor"
            ))
            return False
        
        # Extract current text
        if start.line == end.line:
            current_text = self.buffer[start.line][start.col:end.col]
        else:
            # Multi-line range
            lines = []
            lines.append(self.buffer[start.line][start.col:])
            for i in range(start.line + 1, end.line):
                lines.append(self.buffer[i])
            lines.append(self.buffer[end.line][:end.col])
            current_text = '\n'.join(lines)
        
        # Check expected text if provided
        if expected_text is not None and current_text != expected_text:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.PRECONDITION_FAILED.value,
                message=f"Expected text mismatch at line {start.line}",
                line=start.line,
                source="editor"
            ))
            return False
        
        # Apply replacement
        if start.line == end.line:
            self.buffer[start.line] = (
                self.buffer[start.line][:start.col] +
                replacement +
                self.buffer[start.line][end.col:]
            )
        else:
            # Multi-line replacement
            new_line = (
                self.buffer[start.line][:start.col] +
                replacement +
                self.buffer[end.line][end.col:]
            )
            self.buffer = (
                self.buffer[:start.line] +
                [new_line] +
                self.buffer[end.line + 1:]
            )
        
        return True
    
    def _apply_replace_match(self, edit: Dict[str, Any]) -> bool:
        """Replace matches with scope and safety constraints"""
        pattern = edit['pattern']
        replacement = edit['replacement']
        literal = edit.get('literal', True)
        flags_str = edit.get('flags', '')
        occurrence = edit.get('occurrence', 'all')
        expected_matches = edit.get('expectedMatches')
        scope = edit.get('scope', {'kind': 'whole_document'})
        code_blocks_policy = edit.get('codeBlocks', 'exclude')
        links_policy = edit.get('linksAndImages', 'exclude')
        tables_policy = edit.get('tables', 'exclude')
        
        # Build regex
        if literal:
            pattern = re.escape(pattern)
        
        regex_flags = 0
        if 'i' in flags_str:
            regex_flags |= re.IGNORECASE
        if 'm' in flags_str:
            regex_flags |= re.MULTILINE
        if 's' in flags_str:
            regex_flags |= re.DOTALL
        
        try:
            regex = re.compile(pattern, regex_flags)
        except re.error as e:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.INVALID_OPERATION.value,
                message=f"Invalid regex pattern: {e}",
                source="editor"
            ))
            return False
        
        # Determine scope lines
        if scope['kind'] == 'whole_document':
            start_line = 0
            end_line = len(self.buffer) - 1
        elif scope['kind'] == 'section':
            heading_path = scope['headingPath']
            include_subsections = scope.get('includeSubsections', False)
            section, error_code = self.doc.get_section_by_path(heading_path, include_subsections)
            
            if not section:
                self.diagnostics.append(Diagnostic(
                    severity="error",
                    code=error_code or ErrorCode.SECTION_NOT_FOUND.value,
                    message=f"Section not found: {' > '.join(heading_path)}",
                    source="editor"
                ))
                return False
            
            start_line = section.start_line
            end_line = section.end_line
        else:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.INVALID_OPERATION.value,
                message=f"Unknown scope kind: {scope['kind']}",
                source="editor"
            ))
            return False
        
        # Find all matches within scope
        matches = []
        for line_num in range(start_line, end_line + 1):
            line = self.buffer[line_num]
            
            # Apply safety filters
            if code_blocks_policy == 'exclude' and self.doc.is_in_code_block(line_num):
                continue
            if tables_policy == 'exclude' and self.doc.is_in_table(line_num):
                continue
            
            for match in regex.finditer(line):
                # TODO: Could add link/image detection here if needed
                matches.append((line_num, match))
        
        # Check expected matches
        if expected_matches is not None and len(matches) != expected_matches:
            if len(matches) == 0:
                code = ErrorCode.NO_MATCH.value
                msg = f"No matches found (expected {expected_matches})"
            else:
                code = ErrorCode.AMBIGUOUS_MATCH.value
                msg = f"Found {len(matches)} matches (expected {expected_matches})"
            
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=code,
                message=msg,
                source="editor"
            ))
            return False
        
        # Collect matches for reporting
        for line_num, match in matches:
            self.matches.append(Match(
                line=line_num + 1,  # Convert to 1-based
                col=match.start() + 1,  # Convert to 1-based
                text=match.group(0),
                start_pos=Position(line=line_num + 1, col=match.start() + 1),
                end_pos=Position(line=line_num + 1, col=match.end() + 1)
            ))
        
        # Apply replacements (reverse order to maintain positions)
        if occurrence == 'all':
            to_replace = reversed(matches)
        elif isinstance(occurrence, int):
            if occurrence < 1 or occurrence > len(matches):
                self.diagnostics.append(Diagnostic(
                    severity="error",
                    code=ErrorCode.OUT_OF_RANGE.value,
                    message=f"Occurrence {occurrence} out of range (found {len(matches)} matches)",
                    source="editor"
                ))
                return False
            to_replace = [matches[occurrence - 1]]
        else:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.INVALID_OPERATION.value,
                message=f"Invalid occurrence: {occurrence}",
                source="editor"
            ))
            return False
        
        for line_num, match in to_replace:
            line = self.buffer[line_num]
            self.buffer[line_num] = (
                line[:match.start()] +
                replacement +
                line[match.end():]
            )
        
        return True
    
    def _apply_replace_section(self, edit: Dict[str, Any]) -> bool:
        """Replace entire section content"""
        # Validate required fields
        if 'markdown' not in edit:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.INVALID_OPERATION.value,
                message="replace_section requires 'markdown' field (not 'content')",
                source="editor"
            ))
            return False
        
        heading_path = edit.get('headingPath')
        section_id = edit.get('sectionId')
        markdown = edit['markdown']
        keep_subsections = edit.get('keepSubsections', False)
        
        # Get section by ID or path
        if section_id:
            section = self.doc.get_section_by_id(section_id)
            if not section:
                self.diagnostics.append(Diagnostic(
                    severity="error",
                    code=ErrorCode.SECTION_NOT_FOUND.value,
                    message=f"Section not found with ID: {section_id}",
                    source="editor"
                ))
                return False
        elif heading_path:
            section, error_code = self.doc.get_section_by_path(heading_path)
            if not section:
                self.diagnostics.append(Diagnostic(
                    severity="error",
                    code=error_code or ErrorCode.SECTION_NOT_FOUND.value,
                    message=f"Section not found: {' > '.join(heading_path)}",
                    source="editor"
                ))
                return False
        else:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.INVALID_OPERATION.value,
                message="Either headingPath or sectionId must be provided",
                source="editor"
            ))
            return False
        
        # Determine what to replace
        # Replace from heading line onwards (including the heading)
        # This allows the markdown parameter to include a new heading or just content
        content_start = section.heading_line
        
        if keep_subsections:
            # Find first subsection
            subsection_start = None
            if heading_path:
                for s in self.doc.sections:
                    if (len(s.heading_path) > len(heading_path) and
                        s.heading_path[:len(heading_path)] == heading_path and
                        s.start_line > section.heading_line):
                        subsection_start = s.start_line
                        break
            
            content_end = subsection_start - 1 if subsection_start else section.end_line
        else:
            content_end = section.end_line
        
        # Split new markdown into lines
        new_lines = markdown.split('\n')
        
        # Check if the markdown includes a heading at the start
        # If not, preserve the original heading
        has_heading = False
        if new_lines and new_lines[0].strip().startswith('#'):
            has_heading = True
        
        if not has_heading:
            # User provided content only, keep original heading
            # Insert content after the heading line
            content_start = section.heading_line + 1
            # Preserve the heading line
            preserved_heading = self.buffer[section.heading_line]
            self.buffer = (
                self.buffer[:section.heading_line + 1] +
                new_lines +
                self.buffer[content_end + 1:]
            )
        else:
            # User provided heading in markdown, replace entire section
            self.buffer = (
                self.buffer[:content_start] +
                new_lines +
                self.buffer[content_end + 1:]
            )
        
        return True
    
    def _apply_insert_after_heading(self, edit: Dict[str, Any]) -> bool:
        """Insert content after a heading"""
        # Validate required fields
        if 'markdown' not in edit:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.INVALID_OPERATION.value,
                message="insert_after_heading requires 'markdown' field (not 'content')",
                source="editor"
            ))
            return False
        
        heading_path = edit.get('headingPath')
        section_id = edit.get('sectionId')
        markdown = edit['markdown']
        position = edit.get('position', 'afterHeading')
        ensure_blank_line = edit.get('ensureBlankLine', True)
        
        # Get section by ID or path
        if section_id:
            section = self.doc.get_section_by_id(section_id)
            if not section:
                self.diagnostics.append(Diagnostic(
                    severity="error",
                    code=ErrorCode.SECTION_NOT_FOUND.value,
                    message=f"Section not found with ID: {section_id}",
                    source="editor"
                ))
                return False
        elif heading_path:
            section, error_code = self.doc.get_section_by_path(heading_path)
            if not section:
                self.diagnostics.append(Diagnostic(
                    severity="error",
                    code=error_code or ErrorCode.SECTION_NOT_FOUND.value,
                    message=f"Section not found: {' > '.join(heading_path)}",
                    source="editor"
                ))
                return False
        else:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.INVALID_OPERATION.value,
                message="Either headingPath or sectionId must be provided",
                source="editor"
            ))
            return False
        
        # Determine insertion point
        if position == 'afterHeading':
            insert_line = section.heading_line + 1
        elif position == 'start':
            insert_line = section.heading_line + 1
        elif position == 'end':
            insert_line = section.end_line + 1
        else:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.INVALID_OPERATION.value,
                message=f"Invalid position: {position}",
                source="editor"
            ))
            return False
        
        # Prepare content
        new_lines = markdown.split('\n')
        
        # Add blank line if needed
        if ensure_blank_line and insert_line < len(self.buffer):
            if self.buffer[insert_line].strip():
                new_lines.append('')
        
        # Insert
        self.buffer = (
            self.buffer[:insert_line] +
            new_lines +
            self.buffer[insert_line:]
        )
        
        return True
    
    def _apply_update_front_matter(self, edit: Dict[str, Any]) -> bool:
        """Update YAML front matter"""
        if not YAML_AVAILABLE:
            self.diagnostics.append(Diagnostic(
                severity="error",
                code=ErrorCode.INVALID_OPERATION.value,
                message="YAML library not available",
                source="editor"
            ))
            return False
        
        set_values = edit.get('set', {})
        remove_keys = edit.get('remove', [])
        
        # Load current front matter
        fm = dict(self.doc.front_matter) if self.doc.front_matter else {}
        
        # Apply changes
        for key, value in set_values.items():
            fm[key] = value
        
        for key in remove_keys:
            fm.pop(key, None)
        
        # Serialize back to YAML
        fm_text = yaml.dump(fm, default_flow_style=False, allow_unicode=True)
        fm_lines = fm_text.rstrip('\n').split('\n')
        
        # Replace front matter section
        if self.doc.front_matter_lines:
            start, end = self.doc.front_matter_lines
            self.buffer = (
                ['---'] +
                fm_lines +
                ['---'] +
                self.buffer[end + 1:]
            )
        else:
            # Add new front matter
            self.buffer = (
                ['---'] +
                fm_lines +
                ['---', ''] +
                self.buffer
            )
        
        return True
    
    def get_content(self) -> str:
        """Get current buffer as string"""
        eol = '\r\n' if self.doc.eol == 'CRLF' else '\n'
        return eol.join(self.buffer)


def md_stat(file_path: str) -> Dict[str, Any]:
    """Get markdown file statistics and structure"""
    try:
        doc = MarkdownDocument(file_path)
        doc.load()
        
        # Build section index
        sections_info = []
        for section in doc.sections:
            sections_info.append({
                'headingPath': section.heading_path,
                'canonicalHeadingPath': section.canonical_heading_path,
                'sectionId': section.section_id,
                'level': section.level,
                'startLine': section.start_line,
                'endLine': section.end_line,
                'headingLine': section.heading_line
            })
        
        # Build code blocks info
        code_blocks_info = []
        for block in doc.code_blocks:
            code_blocks_info.append({
                'startLine': block.start_line,
                'endLine': block.end_line,
                'language': block.language,
                'infoString': block.info_string
            })
        
        # Build tables info
        tables_info = []
        for table in doc.tables:
            tables_info.append({
                'startLine': table.start_line,
                'endLine': table.end_line,
                'section': table.section
            })
        
        return {
            'ok': True,
            'filePath': str(doc.file_path),
            'contentSha256': doc.sha256,
            'encoding': doc.encoding,
            'eol': doc.eol,
            'lineCount': len(doc.lines),
            'sections': sections_info,
            'codeBlocks': code_blocks_info,
            'tables': tables_info,
            'frontMatter': doc.front_matter,
            'hasFrontMatter': doc.front_matter is not None
        }
        
    except Exception as e:
        return {
            'ok': False,
            'error': str(e),
            'errorCode': ErrorCode.IO_ERROR.value
        }


def md_validate(file_path: str, autofix_preview: bool = False) -> Dict[str, Any]:
    """Validate markdown file"""
    try:
        doc = MarkdownDocument(file_path)
        doc.load()
        
        diagnostics = []
        
        # Basic validation
        diagnostics.extend(doc.validate_fences())
        
        # TODO: Could integrate pymarkdownlnt here
        
        result = {
            'ok': True,
            'filePath': str(doc.file_path),
            'contentSha256': doc.sha256,
            'diagnostics': [
                {
                    'severity': d.severity,
                    'code': d.code,
                    'message': d.message,
                    'line': d.line,
                    'col': d.col,
                    'source': d.source
                }
                for d in diagnostics
            ]
        }
        
        # Format preview if requested
        if autofix_preview and MDFORMAT_AVAILABLE:
            try:
                formatted = mdformat.text(doc.content)
                if formatted != doc.content:
                    result['formattedPreview'] = formatted
                    result['hasFormatChanges'] = True
                else:
                    result['hasFormatChanges'] = False
            except Exception as e:
                result['formatError'] = str(e)
        
        return result
        
    except Exception as e:
        return {
            'ok': False,
            'error': str(e),
            'errorCode': ErrorCode.IO_ERROR.value
        }


def md_apply(
    file_path: str,
    base_sha256: str,
    edits: List[Dict[str, Any]],
    atomic: bool = True,
    dry_run: bool = False,
    format_mode: str = 'none',
    preserve_eol: bool = True,
    preserve_encoding: bool = True,
    ensure_final_newline: bool = True
) -> Dict[str, Any]:
    """Apply edits to markdown file"""
    try:
        doc = MarkdownDocument(file_path)
        doc.load()
        
        # Check precondition
        if doc.sha256 != base_sha256:
            return {
                'ok': False,
                'error': f"SHA-256 mismatch (file changed)",
                'errorCode': ErrorCode.PRECONDITION_FAILED.value,
                'expected': base_sha256,
                'actual': doc.sha256
            }
        
        # Create editor
        editor = MarkdownEditor(doc)
        
        # Apply edits
        edits_applied = 0
        for i, edit in enumerate(edits):
            success = editor.apply_edit(edit)
            if not success:
                if atomic:
                    return {
                        'ok': False,
                        'error': f"Edit {i} failed",
                        'errorCode': ErrorCode.CONFLICTING_EDITS.value,
                        'diagnostics': [
                            {
                                'severity': d.severity,
                                'code': d.code,
                                'message': d.message,
                                'line': d.line,
                                'col': d.col,
                                'source': d.source
                            }
                            for d in editor.diagnostics
                        ]
                    }
                else:
                    # Continue with non-atomic mode
                    continue
            edits_applied += 1
        
        # Get new content
        new_content = editor.get_content()
        
        # Apply formatting if requested
        if format_mode == 'mdformat' and MDFORMAT_AVAILABLE:
            try:
                new_content = mdformat.text(new_content)
            except Exception as e:
                if atomic:
                    return {
                        'ok': False,
                        'error': f"Formatting failed: {e}",
                        'errorCode': ErrorCode.MARKDOWN_BROKEN.value
                    }
        
        # Ensure final newline if requested
        if ensure_final_newline and not new_content.endswith('\n'):
            new_content += '\n' if doc.eol == 'LF' else '\r\n'
        
        # Generate diff
        import difflib
        diff = '\n'.join(difflib.unified_diff(
            doc.content.splitlines(keepends=True),
            new_content.splitlines(keepends=True),
            fromfile=f"a/{doc.file_path.name}",
            tofile=f"b/{doc.file_path.name}",
            lineterm=''
        ))
        
        # Calculate new hash
        encoding = doc.encoding if preserve_encoding else 'utf-8'
        new_bytes = new_content.encode(encoding)
        new_sha256 = hashlib.sha256(new_bytes).hexdigest()
        
        # Write if not dry run
        if not dry_run:
            doc.file_path.write_bytes(new_bytes)
        
        return {
            'ok': True,
            'filePath': str(doc.file_path),
            'contentSha256': new_sha256,
            'diff': diff,
            'editsApplied': edits_applied,
            'dryRun': dry_run,
            'matches': [
                {
                    'line': m.line,
                    'col': m.col,
                    'text': m.text
                }
                for m in editor.matches
            ],
            'diagnostics': [
                {
                    'severity': d.severity,
                    'code': d.code,
                    'message': d.message,
                    'line': d.line,
                    'col': d.col,
                    'source': d.source
                }
                for d in editor.diagnostics
            ]
        }
        
    except Exception as e:
        import traceback
        return {
            'ok': False,
            'error': str(e),
            'errorCode': ErrorCode.IO_ERROR.value,
            'traceback': traceback.format_exc()
        }


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(description='Markdown tools for MCP')
    parser.add_argument('command', choices=['stat', 'validate', 'apply'],
                       help='Command to execute')
    parser.add_argument('--file', required=True, help='Markdown file path')
    parser.add_argument('--base-sha256', help='Base SHA-256 hash for apply')
    parser.add_argument('--edits', help='JSON edits for apply')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode')
    parser.add_argument('--atomic', action='store_true', default=True,
                       help='Atomic mode (default: true)')
    parser.add_argument('--format', choices=['none', 'mdformat'], default='none',
                       help='Format mode')
    parser.add_argument('--autofix-preview', action='store_true',
                       help='Show format preview in validate')
    
    args = parser.parse_args()
    
    try:
        if args.command == 'stat':
            result = md_stat(args.file)
        
        elif args.command == 'validate':
            result = md_validate(args.file, args.autofix_preview)
        
        elif args.command == 'apply':
            if not args.base_sha256:
                print(json.dumps({
                    'ok': False,
                    'error': '--base-sha256 required for apply'
                }))
                sys.exit(1)
            
            if not args.edits:
                print(json.dumps({
                    'ok': False,
                    'error': '--edits required for apply'
                }))
                sys.exit(1)
            
            edits = json.loads(args.edits)
            result = md_apply(
                args.file,
                args.base_sha256,
                edits,
                atomic=args.atomic,
                dry_run=args.dry_run,
                format_mode=args.format
            )
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        import traceback
        print(json.dumps({
            'ok': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
