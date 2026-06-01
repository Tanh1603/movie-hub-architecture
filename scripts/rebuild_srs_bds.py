from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path

try:
    from docx import Document
    from docx.enum.section import WD_SECTION
    from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
    from docx.enum.text import WD_BREAK
    from docx.shared import Inches, Pt
except ModuleNotFoundError:
    Document = None
    WD_SECTION = WD_TABLE_ALIGNMENT = WD_CELL_VERTICAL_ALIGNMENT = WD_BREAK = None
    Inches = Pt = None


ROOT = Path("docs/functional_specs")
DOCX_OUT = ROOT / "MH_SRS.docx"

MODULE_ORDER = [
    "3.1_User_Management",
    "3.2.1_Cinema_Management",
    "3.2.2_Hall_Management",
    "3.2.3_Ticket_Pricing_Management",
    "3.3.1_Movie_Catalog",
    "3.3.2_Movie_Releases",
    "3.3.3_Genre_Management",
    "3.3.4_Movie_Reviews",
    "3.4_Showtime_Scheduling",
    "3.5.1_User_Booking_Operations",
    "3.5.2_Admin_Booking_Operations",
    "3.5.3_Real-time_Seat_Selection",
    "3.6_Payment_Transaction_Module",
    "3.7_Ticket_Management_Module",
    "3.8_Refund_Management_Module",
    "3.9_Concessions_FB_Module",
    "3.10_Promotions_Discounts_Module",
    "3.11_Loyalty_Points_Module",
    "3.12_System_Configuration_Module",
]

MESSAGES = [
    (
        "1. Confirmation Messages (MSG 1 - MSG 19)",
        [
            ("MSG 11", "Confirmation", "Are you sure you want to delete this [item]?", "Prompted before destructive delete operations."),
        ],
    ),
    (
        "2. Validation & Input Errors (MSG 20 - MSG 39)",
        [
            ("MSG 1", "Error", "This field is mandatory. You must provide information in this field to proceed.", "Mandatory field or required request value is missing."),
            ("MSG 4", "Error", "Your information is not in the correct format. Please check again.", "DTO, query, path parameter, or format validation failed."),
            ("MSG 8", "Error", "The size of image is too large. You need to compress it to upload.", "Uploaded image/file exceeds the configured size limit."),
        ],
    ),
    (
        "3. Authentication & Account Errors (MSG 40 - MSG 59)",
        [
            ("MSG 2", "Error", "Your username or password might be wrong. Please check and try again later.", "Unauthorized request, invalid session, or mapped authentication failure."),
            ("MSG 3", "Success", "Sign in successful.", "Successful sign-in feedback."),
            ("MSG 5", "Error", "Your entered email had been existed in the system. Please check again.", "Duplicate email uniqueness constraint."),
            ("MSG 6", "Error", "Your entered phone number had been existed in the system. Please check again.", "Duplicate phone uniqueness constraint."),
            ("MSG 10", "Error", "This username had been existed in the system. Please choose another username.", "Duplicate username uniqueness constraint."),
        ],
    ),
    (
        "4. General System Success and Failure (MSG 60 - MSG 79)",
        [
            ("MSG 7", "Success", "Save data successful.", "Successful create, update, delete, validation, or state-changing operation."),
            ("MSG 9", "Error", "Your action is failed due to constraints in the system.", "Generic constraint, conflict, invalid state, or unexpected server-side failure."),
        ],
    ),
]


@dataclass
class UseCase:
    path: Path
    module: str
    title: str
    functional_id: str
    fields: dict[str, str]
    sequence: str
    activity: str
    business_rules: list[tuple[str, str, str]]


@dataclass
class DtoField:
    name: str
    type_text: str
    required: bool = True
    default: str = ""
    constraints: list[str] | None = None
    nested: str = ""


@dataclass
class DtoSpec:
    name: str
    fields: list[DtoField]
    source: str


@dataclass
class EndpointInput:
    method: str
    path: str
    dto_names: list[str]
    scalar_inputs: list[DtoField]


BULLET = "\u2756"
SHARED_TYPES_ROOT = Path("libs/shared-types/src")
API_MODULE_ROOT = Path("apps/api-gateway/src/app/module")
DTO_REGISTRY: dict[str, DtoSpec] = {}
ENDPOINTS: list[EndpointInput] = []


def natural_key(path: Path) -> tuple[int, str]:
    module = path.parent.name
    try:
        idx = MODULE_ORDER.index(module)
    except ValueError:
        idx = 999
    return idx, path.name.lower()


def use_case_files() -> list[Path]:
    files = [p for p in ROOT.rglob("*.md") if p.parent != ROOT]
    return sorted(files, key=natural_key)


def clean_inline(value: str) -> str:
    value = value.strip()
    value = value.replace("\\.", ".")
    value = re.sub(r"\*\*(.*?)\*\*", r"\1", value)
    return value.strip()


def strip_code(value: str) -> str:
    return value.replace("`", "").strip()


def split_table_row(line: str) -> list[str]:
    line = line.strip()
    if not line.startswith("|"):
        return []
    line = line.strip("|")
    cells = re.split(r"\s+\|\s+", line)
    return [clean_inline(c) for c in cells]


def normalize_msg_refs(text: str) -> str:
    text = re.sub(r"ResponseMessage\.MSG_(\d+)", r"MSG \1", text)
    text = re.sub(r"\bMSG_(\d+)\b", r"MSG \1", text)
    return text


def strip_existing_rule_title(text: str) -> str:
    text = text.replace("<br>", "\n").strip()
    text = re.sub(
        r"^(Loading Screen|Authorization|Validate|Routing|Checking|Creating|Updating|Deleting|Processing|Retrieval|Integration|Message|Error Handling)\s+Rules:\s*",
        "",
        text,
        flags=re.IGNORECASE,
    ).strip()
    text = re.sub(r"^❖\s*", "", text).strip()
    return text


def code_to_br_label(label: str, description: str) -> tuple[str, str]:
    label_hay = label.lower()
    hay = f"{label} {description}".lower()
    if "input validation" in label_hay:
        return "(3)", "Validate Rules:"
    if "route/message" in label_hay:
        return "(5)", "Routing Rules:"
    if "gateway guard" in label_hay:
        return "(2)", "Authorization Rules:"
    if "public integration endpoint" in hay:
        return "(2)", "Authorization Rules:"
    if "integration constraint" in label_hay:
        return "(6)", "Integration Rules:"
    if "success response" in label_hay:
        return "(7)", "Message Rules:"
    if "failure response" in label_hay:
        return "(8)", "Error Handling Rules:"
    if "success" in hay:
        return "(7)", "Message Rules:"
    if "failure" in hay or "error" in hay or "not found" in hay:
        return "(8)", "Error Handling Rules:"
    if "validation" in hay or "dto" in hay or "schema" in hay or "required" in hay:
        return "(3)", "Validate Rules:"
    if "route" in hay or "message boundary" in hay or "trigger" in hay:
        return "(5)", "Routing Rules:"
    if "integration" in hay or "provider" in hay or "redis" in hay or "service boundary" in hay:
        return "(6)", "Integration Rules:"
    if "gateway" in hay or "guard" in hay or "auth" in hay or "permission" in hay:
        return "(2)", "Authorization Rules:"
    if any(word in hay for word in ["create", "persist", "save", "insert"]):
        return "(5)", "Creating Rules:"
    if any(word in hay for word in ["update", "delete", "cancel", "approve", "reject", "process"]):
        return "(5)", "Processing Rules:"
    if any(word in hay for word in ["list", "get", "read", "return", "response"]):
        return "(5)", "Retrieval Rules:"
    return "(4)", "Checking Rules:"


def bds_description(rule_title: str, description: str) -> str:
    description = strip_existing_rule_title(description)
    description = normalize_msg_refs(strip_code(description))
    description = re.sub(r"\s+", " ", description).strip()
    if not description:
        description = "The system follows the defined activity flow and state constraints for this step."
    if description.startswith("❖"):
        return f"{rule_title}\n{description}"
    return f"{rule_title}\n❖ {description}"


def split_rule_title_body(description: str) -> tuple[str, str]:
    description = description.replace("<br>", "\n").strip()
    match = re.match(
        r"^(Loading Screen|Authorization|Validate|Routing|Checking|Creating|Updating|Deleting|Processing|Retrieval|Integration|Message|Error Handling)\s+Rules:\s*(.*)$",
        description,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if match:
        return f"{match.group(1).title()} Rules:", strip_existing_rule_title(match.group(2))
    return "Processing Rules:", strip_existing_rule_title(description)


def dedupe_bullets(items: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    expanded: list[str] = []
    for item in items:
        for part in item.replace("<br>", "\n").splitlines():
            expanded.append(part)
    for item in expanded:
        item = normalize_msg_refs(strip_code(item))
        item = re.sub(r"\s+", " ", item).strip()
        item = re.sub(r"^❖\s*", "", item).strip()
        if re.fullmatch(r"[:\-\s]+", item):
            continue
        if not item:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def action_rule_title(fields: dict[str, str]) -> str:
    name = fields.get("Name", "").lower()
    trigger = strip_code(fields.get("Trigger", "")).upper()
    if "DELETE" in trigger or "delete" in name:
        return "Deleting Rules:"
    if any(word in trigger for word in ["PUT", "PATCH"]) or "update" in name or "toggle" in name:
        return "Updating Rules:"
    if "POST" in trigger and any(word in name for word in ["create", "sign up", "earn", "redeem", "hold", "confirm", "approve", "process", "pay", "book"]):
        return "Creating Rules:"
    if "GET" in trigger or any(word in name for word in ["list", "get", "find", "search", "filter"]):
        return "Retrieval Rules:"
    if "validate" in name or "check" in name or "calculate" in name:
        return "Checking Rules:"
    return "Processing Rules:"


def relevant_action_bullets(fields: dict[str, str], bullets: list[str]) -> list[str]:
    name = fields.get("Name", "").lower()
    trigger = strip_code(fields.get("Trigger", "")).lower()
    context = f"{name} {trigger}"
    is_delete = "delete" in context
    is_update = any(word in context for word in ["update", "put", "patch", "toggle"])
    is_create = any(word in context for word in ["create", "post", "book", "pay", "earn", "redeem", "hold", "confirm", "approve", "process"])
    is_read = any(word in context for word in ["get", "list", "find", "search", "filter"])
    out: list[str] = []
    for bullet in bullets:
        low = bullet.lower()
        if "delete" in low and not is_delete and "cannot delete" in low:
            continue
        if "status filters" in low and not ("filter" in context or "list" in context):
            continue
        if "responses are returned" in low and not is_read:
            continue
        if "create actions" in low and not is_create:
            continue
        if "update" in low and "staff create/update" in low and "staff" not in context:
            continue
        out.append(bullet)
    return out


def relevant_error_bullets(fields: dict[str, str], bullets: list[str]) -> list[str]:
    name = fields.get("Name", "").lower()
    trigger = strip_code(fields.get("Trigger", "")).lower()
    context = f"{name} {trigger}"
    is_delete = "delete" in context
    is_staff = "staff" in context
    out: list[str] = []
    for bullet in dedupe_bullets(bullets):
        low = bullet.lower()
        if "cannot delete" in low and not is_delete:
            continue
        if "staff" in low and not is_staff and "user authentication" not in context:
            continue
        out.append(bullet)
    return out


def make_rule_description(title: str, bullets: list[str]) -> str:
    bullets = dedupe_bullets(bullets)
    if not bullets:
        bullets = ["The system follows the defined activity flow and data constraints for this step."]
    return title + "\n" + "\n".join(f"{BULLET} {bullet}" for bullet in bullets)


def remove_ts_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    return re.sub(r"//.*", "", text)


def find_matching(text: str, start: int, opener: str, closer: str) -> int:
    depth = 0
    quote = ""
    escape = False
    for idx in range(start, len(text)):
        ch = text[idx]
        if quote:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                quote = ""
            continue
        if ch in {"'", '"', "`"}:
            quote = ch
        elif ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                return idx
    return -1


def split_top_level(text: str, sep: str = ",") -> list[str]:
    parts: list[str] = []
    depth_round = depth_curly = depth_square = 0
    quote = ""
    escape = False
    start = 0
    for idx, ch in enumerate(text):
        if quote:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                quote = ""
            continue
        if ch in {"'", '"', "`"}:
            quote = ch
        elif ch == "(":
            depth_round += 1
        elif ch == ")":
            depth_round -= 1
        elif ch == "{":
            depth_curly += 1
        elif ch == "}":
            depth_curly -= 1
        elif ch == "[":
            depth_square += 1
        elif ch == "]":
            depth_square -= 1
        elif ch == sep and depth_round == depth_curly == depth_square == 0:
            part = text[start:idx].strip()
            if part:
                parts.append(part)
            start = idx + 1
    last = text[start:].strip()
    if last:
        parts.append(last)
    return parts


def top_level_method_arg(expr: str, method: str) -> str:
    quote = ""
    escape = False
    depth = 0
    needle = f".{method}("
    idx = 0
    while idx < len(expr):
        ch = expr[idx]
        if quote:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                quote = ""
            idx += 1
            continue
        if ch in {"'", '"', "`"}:
            quote = ch
        elif ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif depth == 0 and expr.startswith(needle, idx):
            start = idx + len(needle) - 1
            end = find_matching(expr, start, "(", ")")
            return expr[start + 1 : end].strip() if end > start else ""
        idx += 1
    return ""


def top_level_has_method(expr: str, method: str) -> bool:
    quote = ""
    escape = False
    depth = 0
    needle = f".{method}("
    idx = 0
    while idx < len(expr):
        ch = expr[idx]
        if quote:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                quote = ""
            idx += 1
            continue
        if ch in {"'", '"', "`"}:
            quote = ch
        elif ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif depth == 0 and expr.startswith(needle, idx):
            return True
        idx += 1
    return False


def parse_default(expr: str) -> str:
    raw = top_level_method_arg(expr, "default")
    if not raw:
        return ""
    return re.sub(r"\s+", " ", raw).strip()[:80]


def enum_values(expr: str) -> str:
    object_values = re.search(r"Object\.values\((\w+)\)", expr)
    if object_values:
        return object_values.group(1)
    match = re.search(r"z\.enum\(\s*\[([^\]]+)\]", expr, flags=re.DOTALL)
    if match:
        return ", ".join(re.findall(r"['\"]([^'\"]+)['\"]", match.group(1)))
    match = re.search(r"(?:z\.)?(?:nativeEnum|enum)\(([^)]+)\)", expr)
    return match.group(1).strip() if match else ""


def zod_type(expr: str) -> str:
    if "z.array" in expr:
        if "z.string" in expr:
            return "array<string>"
        if "z.number" in expr or "z.coerce.number" in expr:
            return "array<number>"
        if "z.object" in expr:
            return "array<object>"
        return "array"
    if "z.coerce.date" in expr or "z.date" in expr:
        return "date"
    if "z.coerce.number" in expr or "z.number" in expr:
        return "number"
    if "z.string" in expr:
        return "string"
    if "z.boolean" in expr:
        return "boolean"
    if "z.object" in expr:
        return "object"
    if "z.any" in expr:
        return "any"
    if "z.enum" in expr or "nativeEnum" in expr:
        return "enum"
    return "value"


def zod_constraints(expr: str) -> list[str]:
    constraints: list[str] = []
    for value in re.findall(r"\.min\(([^),]+)", expr):
        constraints.append(f"minimum {value.strip()}")
    for value in re.findall(r"\.max\(([^),]+)", expr):
        constraints.append(f"maximum {value.strip()}")
    if ".positive(" in expr or ".positive()" in expr:
        constraints.append("must be positive")
    if ".nonnegative(" in expr or ".nonnegative()" in expr:
        constraints.append("must be non-negative")
    if ".int(" in expr or ".int()" in expr:
        constraints.append("must be an integer")
    if ".uuid(" in expr or ".uuid()" in expr:
        constraints.append("must be a UUID")
    if ".email(" in expr or ".email()" in expr or "emailRegex" in expr:
        constraints.append("must be an email format")
    if "z.coerce." in expr:
        constraints.append("is coerced from request input")
    values = enum_values(expr)
    if values:
        constraints.append(f"allowed values: {values}")
    object_start = expr.find("z.object")
    brace_start = expr.find("{", object_start) if object_start >= 0 else -1
    if brace_start >= 0:
        brace_end = find_matching(expr, brace_start, "{", "}")
        if brace_end > brace_start:
            nested = []
            for entry in split_top_level(expr[brace_start + 1 : brace_end]):
                field_match = re.match(r"([A-Za-z_$][\w$]*)\s*:", entry.strip())
                if field_match:
                    nested.append(field_match.group(1))
            if nested:
                constraints.append(f"nested fields: {', '.join(nested)}")
    return constraints


def parse_zod_object_fields(body: str) -> list[DtoField]:
    fields: list[DtoField] = []
    for entry in split_top_level(remove_ts_comments(body)):
        match = re.match(r"([A-Za-z_$][\w$]*)\s*:\s*(.+)$", entry.strip(), flags=re.DOTALL)
        if not match:
            continue
        name, expr = match.group(1), match.group(2).strip()
        default = parse_default(expr)
        required = not top_level_has_method(expr, "optional") and not default
        constraints = zod_constraints(expr)
        if name.lower() == "email" and not any("email" in c.lower() for c in constraints):
            constraints.append("must be an email format")
        type_text = zod_type(expr)
        if name.lower() == "email" and type_text == "value":
            type_text = "string"
        fields.append(DtoField(name, type_text, required, default, constraints))
    return fields


def clone_spec(name: str, base: DtoSpec, source: str, partial: bool = False, omit: set[str] | None = None) -> DtoSpec:
    omit = omit or set()
    return DtoSpec(
        name,
        [
            DtoField(f.name, f.type_text, False if partial else f.required, f.default, list(f.constraints or []), f.nested)
            for f in base.fields
            if f.name not in omit
        ],
        source,
    )


def parse_interfaces_from_text(text: str, source: str, existing: dict[str, DtoSpec]) -> dict[str, DtoSpec]:
    specs: dict[str, DtoSpec] = {}
    for match in re.finditer(r"export\s+interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*{", text):
        name = match.group(1)
        extends = [part.strip() for part in (match.group(2) or "").split(",") if part.strip()]
        body_start = match.end() - 1
        body_end = find_matching(text, body_start, "{", "}")
        if body_end < 0:
            continue
        fields: list[DtoField] = []
        for parent in extends:
            parent_name = re.sub(r"<.*>$", "", parent).strip()
            parent_spec = specs.get(parent_name) or existing.get(parent_name)
            if parent_spec:
                fields.extend(parent_spec.fields)
        pending_comment = ""
        for line in text[body_start + 1 : body_end].splitlines():
            stripped = line.strip()
            if not stripped:
                pending_comment = ""
                continue
            comment_match = re.match(r"//\s*(.+)", stripped)
            if comment_match:
                pending_comment = comment_match.group(1).strip()
                continue
            field_match = re.match(r"(\w+)(\?)?\s*:\s*([^;]+);?", stripped)
            if not field_match:
                continue
            fname, optional, type_text = field_match.group(1), field_match.group(2), field_match.group(3).strip()
            constraints: list[str] = []
            union_values = re.findall(r"'([^']+)'", type_text) + re.findall(r'"([^"]+)"', type_text)
            if union_values:
                constraints.append(f"allowed values: {', '.join(union_values)}")
            ref_name = re.sub(r"\[\]$", "", type_text).strip()
            ref_spec = specs.get(ref_name) or existing.get(ref_name)
            if ref_spec:
                constraints.append(f"nested fields: {', '.join(f.name for f in ref_spec.fields)}")
            if pending_comment:
                constraints.append(pending_comment)
            fields.append(DtoField(fname, type_text, optional != "?", "", constraints))
            pending_comment = ""
        specs[name] = DtoSpec(name, fields, source)
    return specs


def load_dto_registry() -> dict[str, DtoSpec]:
    global DTO_REGISTRY
    if DTO_REGISTRY:
        return DTO_REGISTRY

    specs: dict[str, DtoSpec] = {}
    schema_specs: dict[str, DtoSpec] = {}
    aliases: list[tuple[str, str, set[str], bool]] = []
    class_to_schema: list[tuple[str, str, str]] = []

    dto_paths = sorted(SHARED_TYPES_ROOT.rglob("*.ts"), key=lambda p: (0 if "\\common\\" in str(p) or "/common/" in str(p) else 1, str(p)))
    for path in dto_paths:
        text = path.read_text(encoding="utf-8")
        rel = str(path).replace("\\", "/")
        specs.update(parse_interfaces_from_text(text, rel, specs))

        for match in re.finditer(r"export\s+const\s+(\w+)\s*=\s*z\s*(?:\.\s*\w+\s*\([^)]*\)\s*)*?\.\s*object\s*\(", text):
            schema_name = match.group(1)
            paren_start = text.find("(", match.end() - 1)
            paren_end = find_matching(text, paren_start, "(", ")")
            if paren_end < 0:
                continue
            arg = text[paren_start + 1 : paren_end].strip()
            if arg.startswith("{"):
                brace_end = find_matching(arg, 0, "{", "}")
                body = arg[1:brace_end] if brace_end >= 0 else arg.strip("{}")
                schema_specs[schema_name] = DtoSpec(schema_name, parse_zod_object_fields(body), rel)

        for match in re.finditer(r"export\s+const\s+(\w+)\s*=\s*(\w+)\.(partial|strict)\s*\(\s*\)", text):
            aliases.append((match.group(1), match.group(2), set(), match.group(3) == "partial"))
        for match in re.finditer(r"export\s+const\s+(\w+)\s*=\s*(\w+)\.omit\s*\(\s*{([^}]+)}\s*\)", text, flags=re.DOTALL):
            aliases.append((match.group(1), match.group(2), set(re.findall(r"(\w+)\s*:", match.group(3))), False))
        for match in re.finditer(r"export\s+type\s+(\w+)\s*=\s*z\.infer\s*<\s*typeof\s+(\w+)\s*>", text):
            aliases.append((match.group(1), match.group(2), set(), False))
        for match in re.finditer(r"export\s+class\s+(\w+)\s+extends\s+createZodDto\s*\(\s*(\w+)", text):
            class_to_schema.append((match.group(1), match.group(2), rel))

    changed = True
    while changed:
        changed = False
        for alias, base_name, omitted, partial in aliases:
            if alias in schema_specs:
                continue
            base = schema_specs.get(base_name)
            if base:
                schema_specs[alias] = clone_spec(alias, base, base.source, partial=partial, omit=omitted)
                changed = True

    specs.update(schema_specs)
    for class_name, schema_name, source in class_to_schema:
        if schema_name in schema_specs:
            specs[class_name] = clone_spec(class_name, schema_specs[schema_name], source)

    DTO_REGISTRY = specs
    return DTO_REGISTRY


def controller_base_path(text: str) -> str:
    obj_match = re.search(r"@Controller\s*\(\s*{[^}]*path\s*:\s*['\"]([^'\"]+)['\"]", text, flags=re.DOTALL)
    if obj_match:
        return obj_match.group(1).strip("/")
    str_match = re.search(r"@Controller\s*\(\s*['\"]([^'\"]+)['\"]", text)
    return str_match.group(1).strip("/") if str_match else ""


def normalize_route(path: str) -> str:
    path = strip_code(path).strip()
    path = re.sub(r"^(GET|POST|PUT|PATCH|DELETE)\s+", "", path, flags=re.IGNORECASE).strip()
    path = re.sub(r"^/v\d+/", "/", path)
    path = re.sub(r"^v\d+/", "", path)
    path = "/" + path.strip("/")
    return re.sub(r"/+", "/", path).rstrip("/") or "/"


def extract_method_signature(text: str, start: int) -> str:
    brace = text.find("{", start)
    return text[start:brace] if brace >= 0 else text[start : start + 800]


def scalar_type_from_decorator(decorator: str, ts_type: str) -> str:
    if "ParseIntPipe" in decorator:
        return "integer"
    if "ParseFloatPipe" in decorator:
        return "number"
    return ts_type.strip() or "string"


def parse_controller_endpoints() -> list[EndpointInput]:
    global ENDPOINTS
    if ENDPOINTS:
        return ENDPOINTS
    registry = load_dto_registry()
    endpoints: list[EndpointInput] = []
    route_pattern = re.compile(r"@(Get|Post|Put|Patch|Delete)\s*\(\s*(?:['\"]([^'\"]*)['\"])?\s*\)", re.IGNORECASE)
    for path in API_MODULE_ROOT.rglob("*.controller.ts"):
        text = path.read_text(encoding="utf-8")
        base = controller_base_path(text)
        route_matches = list(route_pattern.finditer(text))
        for idx, match in enumerate(route_matches):
            method = match.group(1).upper()
            sub = (match.group(2) or "").strip("/")
            full_path = normalize_route("/".join(part for part in [base, sub] if part))
            next_start = route_matches[idx + 1].start() if idx + 1 < len(route_matches) else min(len(text), match.end() + 3000)
            signature = text[match.end() : next_start]
            dto_names: list[str] = []
            scalars: list[DtoField] = []
            for body_match in re.finditer(r"@Body\s*\((.*)\)\s*(\w+)\??\s*:\s*([^,\n)]+)", signature):
                arg, typ = body_match.group(1), body_match.group(3).strip()
                field_name_match = re.search(r"['\"]([^'\"]+)['\"]", arg)
                if field_name_match:
                    scalars.append(DtoField(field_name_match.group(1), typ, "?" not in body_match.group(0), "", ["request body field"]))
                elif typ in registry:
                    dto_names.append(typ)
            for query_match in re.finditer(r"@Query\s*\((.*)\)\s*(\w+)\??\s*:\s*([^,\n)]+)", signature):
                arg, typ = query_match.group(1), query_match.group(3).strip()
                field_name_match = re.search(r"['\"]([^'\"]+)['\"]", arg)
                required = "?" not in query_match.group(0) and "DefaultValuePipe" not in arg
                default_match = re.search(r"DefaultValuePipe\s*\(\s*([^)]+)\)", arg)
                if field_name_match:
                    scalars.append(
                        DtoField(
                            field_name_match.group(1),
                            scalar_type_from_decorator(arg, typ),
                            required,
                            default_match.group(1).strip() if default_match else "",
                            ["query parameter"],
                        )
                    )
                elif typ in registry:
                    dto_names.append(typ)
            for param_match in re.finditer(r"@Param\s*\((.*)\)\s*(\w+)\??\s*:\s*([^,\n)]+)", signature):
                arg, name, typ = param_match.group(1), param_match.group(2), param_match.group(3).strip()
                field_name_match = re.search(r"['\"]([^'\"]+)['\"]", arg)
                scalars.append(DtoField(field_name_match.group(1) if field_name_match else name, scalar_type_from_decorator(arg, typ), True, "", ["path parameter"]))
            endpoints.append(EndpointInput(method, full_path, list(dict.fromkeys(dto_names)), scalars))
    ENDPOINTS = endpoints
    return ENDPOINTS


def parse_trigger(trigger: str) -> tuple[str, str]:
    trigger = strip_code(trigger)
    match = re.match(r"(GET|POST|PUT|PATCH|DELETE)\s+(.+)$", trigger, flags=re.IGNORECASE)
    if not match:
        return "", normalize_route(trigger)
    return match.group(1).upper(), normalize_route(match.group(2))


def route_score(expected: str, actual: str) -> int:
    exp_parts = [part for part in normalize_route(expected).split("/") if part]
    act_parts = [part for part in normalize_route(actual).split("/") if part]
    if exp_parts == act_parts:
        return 1000
    if len(exp_parts) != len(act_parts):
        return 0
    score = 0
    for exp, act in zip(exp_parts, act_parts):
        if exp == act:
            score += 10
        elif exp.startswith(":") or act.startswith(":"):
            score += 5
        else:
            return 0
    return score


def find_endpoint(fields: dict[str, str]) -> EndpointInput | None:
    method, path = parse_trigger(fields.get("Trigger", ""))
    if not method:
        return None
    best: tuple[int, EndpointInput] | None = None
    for endpoint in parse_controller_endpoints():
        if endpoint.method != method:
            continue
        score = route_score(path, endpoint.path)
        if score and (best is None or score > best[0]):
            best = (score, endpoint)
    return best[1] if best else None


def describe_field(field: DtoField) -> str:
    parts = [f"[{field.name}] is {'required' if field.required else 'optional'}", f"type {field.type_text}"]
    if field.default:
        parts.append(f"default {field.default}")
    if field.constraints:
        parts.append("; ".join(field.constraints))
    if field.nested:
        parts.append(field.nested)
    return ", ".join(parts)


def dto_validate_bullets(fields: dict[str, str]) -> list[str]:
    endpoint = find_endpoint(fields)
    if not endpoint:
        return []
    registry = load_dto_registry()
    all_fields: list[DtoField] = list(endpoint.scalar_inputs)
    sources: list[str] = []
    for dto_name in endpoint.dto_names:
        spec = registry.get(dto_name)
        if not spec:
            continue
        sources.append(dto_name)
        all_fields.extend(spec.fields)
    unique: dict[str, DtoField] = {}
    for field in all_fields:
        unique.setdefault(field.name, field)
    all_fields = list(unique.values())
    if not all_fields:
        return []

    required = [f.name for f in all_fields if f.required]
    optional = [f.name for f in all_fields if not f.required]
    defaults = [f"[{f.name}] = {f.default}" for f in all_fields if f.default]
    constrained = [describe_field(f) for f in all_fields if f.constraints or f.default or f.type_text not in {"value", "any"}]
    bullets = [f"The system checks the items {', '.join(f'[{f.name}]' for f in all_fields)}."]
    if sources:
        bullets.append(f"The system validates data according to DTO/schema {', '.join(sources)}.")
    if required:
        bullets.append(f"Required fields: {', '.join(f'[{name}]' for name in required)}.")
        bullets.append("If any required entries are empty, the system shows error message MSG 1.")
    if optional:
        bullets.append(f"Optional fields: {', '.join(f'[{name}]' for name in optional)}.")
    if defaults:
        bullets.append(f"Default values: {', '.join(defaults)}.")
    for item in constrained:
        bullets.append(f"Field constraint: {item}.")
    bullets.append("If any type, format, enum, range, date, UUID, or email constraint is invalid, the system shows error message MSG 4.")
    return bullets


def compact_business_rules(
    fields: dict[str, str],
    raw_rules: list[tuple[str, str]],
    br_start: int,
) -> tuple[list[tuple[str, str, str]], int]:
    grouped: dict[str, list[str]] = {
        "validate": [],
        "action": [],
        "message": [],
        "error": [],
    }
    for title, body in raw_rules:
        title_l = title.lower()
        if title_l.startswith("loading"):
            continue
        if title_l.startswith(("authorization", "validate", "routing")):
            grouped["validate"].append(body)
        elif title_l.startswith("message"):
            grouped["message"].append(body)
        elif title_l.startswith("error"):
            grouped["error"].append(body)
        else:
            grouped["action"].append(body)

    name = fields.get("Name", "current function")
    trigger = strip_code(fields.get("Trigger", ""))
    load_bullets = [f'The system loads the "{name}" function and receives the request/event.']
    if trigger:
        load_bullets.append(f"The system uses trigger [{trigger}].")

    validate_existing = dedupe_bullets(grouped["validate"])
    moved_to_action: list[str] = []
    kept_validate: list[str] = []
    for bullet in validate_existing:
        low = bullet.lower()
        if "create actions" in low or "update actions" in low or "delete actions" in low:
            moved_to_action.append(bullet)
        else:
            kept_validate.append(bullet)

    generated_validate = dto_validate_bullets(fields)
    if generated_validate:
        validate_bullets = generated_validate
    else:
        validate_bullets = [
            "The system checks actor permission, path parameters, query values, and request body before processing.",
            *kept_validate,
            "If any mandatory entries are empty, the system shows error message MSG 1.",
            "If request information is not in the correct format, the system shows error message MSG 4.",
        ]

    action_bullets = relevant_action_bullets(fields, dedupe_bullets(grouped["action"]) + moved_to_action) or [
        "The system executes the main business operation and returns the requested data or persists the state change consistently."
    ]

    message_bullets = grouped["message"] or [
        "For successful write or state-changing operations, the system shows success message MSG 7.",
        "For successful read operations, the system returns the requested DTO/list without creating extra success text.",
    ]

    rows: list[tuple[str, str, str]] = []
    br = br_start
    for activity, title, bullets in [
        ("(1)", "Loading Screen Rules:", load_bullets),
        ("(3)", "Validate Rules:", validate_bullets),
        ("(5)", action_rule_title(fields), action_bullets),
        ("(7)", "Message Rules:", message_bullets),
    ]:
        rows.append((activity, f"BR{br}", make_rule_description(title, bullets)))
        br += 1

    error_bullets = relevant_error_bullets(fields, grouped["error"])
    if error_bullets:
        rows.append(
            (
                "(8)",
                f"BR{br}",
                make_rule_description(
                    "Error Handling Rules:",
                    error_bullets + ["If a constraint, conflict, or unexpected failure occurs, the system shows error message MSG 9."],
                ),
            )
        )
        br += 1
    return rows, br


def extract_between(text: str, start: str, end: str | None) -> str:
    start_match = re.search(start, text, flags=re.MULTILINE)
    if not start_match:
        return ""
    if end is None:
        return text[start_match.end() :].strip()
    end_match = re.search(end, text[start_match.end() :], flags=re.MULTILINE)
    if not end_match:
        return text[start_match.end() :].strip()
    return text[start_match.end() : start_match.end() + end_match.start()].strip()


def parse_use_case(path: Path, br_start: int) -> tuple[UseCase, int]:
    text = path.read_text(encoding="utf-8")
    title_match = re.search(r"^#\s+(.+)$", text, flags=re.MULTILINE)
    title = clean_inline(title_match.group(1)) if title_match else path.stem
    id_match = re.search(r"\[([A-Z]{2,}(?:-A)?-\d{2}|[A-Z]{2}-A\d{2})\]", title)
    functional_id = id_match.group(1) if id_match else path.stem.split("_", 1)[0]
    if not id_match or not title.startswith("["):
        name_from_file = path.stem.split("_", 1)[1] if "_" in path.stem else path.stem
        title = f"[{functional_id}] {name_from_file.replace('_', ' ')}"

    desc = extract_between(text, r"^##\s+1\.\s+Description\s*$", r"^##\s+2\.\s+Sequence Flow\s*$")
    if not desc:
        desc = extract_between(text, r"^##\s+Use Case Description\s*$", r"^##\s+Activities Flow\s*$")
    fields: dict[str, str] = {}
    for line in desc.splitlines():
        cells = split_table_row(line)
        if len(cells) >= 2 and cells[0].lower() not in {"field", ":---"}:
            key = cells[0]
            if key.startswith(":"):
                continue
            fields[key] = cells[1]
    title_name = re.sub(r"^\[[^\]]+\]\s*", "", title)
    if not fields.get("Name") or fields.get("Name", "").endswith("Rules:"):
        fields["Name"] = title_name
    else:
        fields.setdefault("Name", title_name)
    fields.setdefault("Description", "")
    fields.setdefault("Actor", "User")
    fields.setdefault("Trigger", "")
    fields.setdefault("Pre-condition", "")
    fields.setdefault("Post-condition", "")

    sequence = extract_between(text, r"^##\s+2\.\s+Sequence Flow\s*$", r"^##\s+3\.\s+Activity Flow\s*$")
    activity = extract_between(text, r"^##\s+3\.\s+Activity Flow\s*$", r"^##\s+4\.\s+Business Rules\s*$")
    if not activity:
        activity = extract_between(text, r"^##\s+Activities Flow\s*$", r"^##\s+Sequence Flow\s*$")
    if not sequence:
        sequence = extract_between(text, r"^##\s+Sequence Flow\s*$", r"^##\s+Business Rules\s*$")
    br_text = extract_between(text, r"^##\s+4\.\s+Business Rules\s*$", None)
    if not br_text:
        br_text = extract_between(text, r"^##\s+Business Rules\s*$", None)

    raw_rules: list[tuple[str, str]] = []
    for line in br_text.splitlines():
        cells = split_table_row(line)
        if len(cells) < 3:
            continue
        if cells[0].lower() in {"activity step", "activity", ":---"}:
            continue
        old_activity, _old_code, old_desc = cells[0], cells[1], cells[2]
        if re.fullmatch(r"\(\d+\)", old_activity):
            rule_title, body = split_rule_title_body(old_desc)
        else:
            activity_no, rule_title = code_to_br_label(old_activity, old_desc)
            body = strip_existing_rule_title(old_desc)
        raw_rules.append((rule_title, body))

    business_rules, br_counter = compact_business_rules(fields, raw_rules, br_start)

    return (
        UseCase(
            path=path,
            module=path.parent.name,
            title=title,
            functional_id=functional_id,
            fields=fields,
            sequence=build_sequence(fields, sequence, business_rules),
            activity=build_activity(fields, sequence, business_rules),
            business_rules=business_rules,
        ),
        br_counter,
    )


def plantuml_escape(value: str) -> str:
    return strip_code(value).replace('"', "'")


def infer_service(sequence: str, module: str) -> str:
    match = re.search(r'control\s+"([^"]+)"\s+as\s+SVC', sequence)
    if match:
        return match.group(1)
    if module.startswith("3.1") or module.startswith("3.12"):
        return "User Service"
    if module.startswith("3.2") or module.startswith("3.4") or module.startswith("3.5.3"):
        return "Cinema Service"
    if module.startswith("3.3"):
        return "Movie Service"
    return "Booking Service"


def infer_db(service: str) -> str:
    return service.replace(" Service", " Database")


def infer_pattern(sequence: str, trigger: str) -> str:
    match = re.search(r"Send\s+`([^`]+)`", sequence)
    if match:
        return match.group(1)
    return trigger or "service.command"


def br_for_activity(business_rules: list[tuple[str, str, str]], activity: str) -> str:
    codes = [code for act, code, _ in business_rules if act == activity]
    return ", ".join(codes) if codes else ""


def build_sequence(fields: dict[str, str], old_sequence: str, business_rules: list[tuple[str, str, str]]) -> str:
    actor = plantuml_escape(fields.get("Actor", "User"))
    trigger = plantuml_escape(fields.get("Trigger", "Send request/event"))
    service = infer_service(old_sequence, "")
    db = infer_db(service)
    pattern = infer_pattern(old_sequence, trigger)
    br1 = br_for_activity(business_rules, "(1)")
    br3 = br_for_activity(business_rules, "(3)")
    br5 = br_for_activity(business_rules, "(5)")
    br7 = br_for_activity(business_rules, "(7)")
    br8 = br_for_activity(business_rules, "(8)")
    return "\n".join(
        [
            "```plantuml",
            "@startuml",
            "autonumber",
            f'actor "{actor}" as Actor',
            'boundary "API Gateway" as GW',
            f'control "{service}" as SVC',
            f'database "{db}" as DB',
            'control "External Provider / Redis / Related Services" as EXT',
            "",
            f"Actor -> GW: (1) {trigger} [{br1}]",
            f"GW -> GW: (3) Validate authentication, params, query, and body [{br3}]",
            f"GW -> SVC: (5) Send `{pattern}` [{br5}]",
            f"SVC -> DB: (5) Load records, ownership, and current state [{br5}]",
            f"SVC -> SVC: (5) Apply business rules and build result [{br5}]",
            f"SVC -> EXT: (5) Call downstream integration when required [{br5}]",
            "EXT --> SVC: Integration result or failure",
            f"SVC --> GW: (7)/(8) ServiceResult, DTO, or mapped error [{br7}{('/' + br8) if br8 else ''}]",
            "GW --> Actor: API response",
            "@enduml",
            "```",
        ]
    )


def build_activity(fields: dict[str, str], old_sequence: str, business_rules: list[tuple[str, str, str]]) -> str:
    actor = plantuml_escape(fields.get("Actor", "User"))
    service = infer_service(old_sequence, "")
    br1 = br_for_activity(business_rules, "(1)")
    br3 = br_for_activity(business_rules, "(3)")
    br5 = br_for_activity(business_rules, "(5)")
    br7 = br_for_activity(business_rules, "(7)")
    br8 = br_for_activity(business_rules, "(8)")
    return "\n".join(
        [
            "```plantuml",
            "@startuml",
            f"|{actor}|",
            "start",
            f":(1) Send request/event [{br1}];",
            "|API Gateway|",
            f":(3) Validate authentication, params, query, and body [{br3}];",
            "if (Authorized?) then (yes)",
            f"  :(3) Validate required input and format [{br3}];",
            "  if (Validation passed?) then (yes)",
            f"    |{service}|",
            f"    :(5) Check records, ownership, and state [{br5}];",
            "    if (Checks pass?) then (yes)",
            f"      :(5) Execute business action or prepare read result [{br5}];",
            "      if (Downstream integration needed?) then (yes)",
            f"        :(5) Call provider/Redis/related service [{br5}];",
            "        if (Integration succeeds?) then (yes)",
            f"          :(7) Return success result [{br7}];",
            "        else (no)",
            f"          :(8) Return integration failure [{br8 or 'BR-ERROR'}];",
            "          stop",
            "        endif",
            "      else (no)",
            f"        :(7) Return success result [{br7}];",
            "      endif",
            "      |API Gateway|",
            f"      :(7) Wrap/forward success response [{br7}];",
            f"      |{actor}|",
            "      :Receive result;",
            "      stop",
            "    else (no)",
            "      |API Gateway|",
            f"      :(8) Return not-found, forbidden, conflict, or invalid-state error [{br8 or 'BR-ERROR'}];",
            "      stop",
            "    endif",
            "  else (no)",
            f"    :(8) Return MSG 1 or MSG 4 [{br3}];",
            "    stop",
            "  endif",
            "else (no)",
            f"  :(8) Return MSG 2 or MSG 9 [{br8 or br3}];",
            "  stop",
            "endif",
            "@enduml",
            "```",
        ]
    )


def render_md(uc: UseCase) -> str:
    lines = [
        f"# {uc.title}",
        "",
        "## Use Case Description",
        "",
        "| Field | Details |",
        "| :--- | :--- |",
    ]
    for key in ["Name", "Description", "Actor", "Trigger", "Pre-condition", "Post-condition"]:
        lines.append(f"| **{key}** | {uc.fields.get(key, '').strip()} |")
    lines += [
        "",
        "## Activities Flow",
        "",
        uc.activity,
        "",
        "## Sequence Flow",
        "",
        uc.sequence,
        "",
        "## Business Rules",
        "",
        "| Activity | BR Code | Description |",
        "| :--- | :--- | :--- |",
    ]
    for activity, code, desc in uc.business_rules:
        desc_cell = desc.replace("\n", "<br>")
        lines.append(f"| {activity} | {code} | {desc_cell} |")
    lines.append("")
    return "\n".join(lines)


def add_table(document: Document, rows: list[list[str]], widths: list[float] | None = None) -> None:
    table = document.add_table(rows=len(rows), cols=len(rows[0]))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    for r_idx, row in enumerate(rows):
        for c_idx, text in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            cell.text = ""
            for idx, part in enumerate(str(text).split("\n")):
                if idx:
                    cell.add_paragraph()
                paragraph = cell.paragraphs[-1]
                run = paragraph.add_run(part)
                run.font.size = Pt(9)
                if r_idx == 0:
                    run.bold = True
            if widths and c_idx < len(widths):
                cell.width = Inches(widths[c_idx])


def add_code_block(document: Document, text: str) -> None:
    content = re.sub(r"^```plantuml\s*|\s*```$", "", text.strip(), flags=re.MULTILINE).strip()
    for line in content.splitlines():
        paragraph = document.add_paragraph()
        run = paragraph.add_run(line)
        run.font.name = "Consolas"
        run.font.size = Pt(8)


def add_use_case_to_docx(document: Document, uc: UseCase) -> None:
    document.add_heading(re.sub(r"^\[[^\]]+\]\s*", "", uc.title), level=4)
    document.add_heading("Use Case Description", level=5)
    add_table(
        document,
        [["Name", uc.fields.get("Name", "")]]
        + [[key, uc.fields.get(key, "")] for key in ["Description", "Actor", "Trigger", "Pre-condition", "Post-condition"]],
        [1.4, 5.8],
    )
    document.add_heading("Activities Flow", level=5)
    add_code_block(document, uc.activity)
    document.add_heading("Sequence Flow", level=5)
    add_code_block(document, uc.sequence)
    document.add_heading("Business Rules", level=5)
    add_table(document, [["Activity", "BR Code", "Description"]] + [list(row) for row in uc.business_rules], [0.7, 0.9, 5.7])


def build_docx(use_cases: list[UseCase]) -> None:
    if Document is None:
        raise RuntimeError("python-docx is required for --build-docx")
    document = Document()
    section = document.sections[0]
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

    styles = document.styles
    styles["Normal"].font.name = "Arial"
    styles["Normal"].font.size = Pt(10)

    title = document.add_paragraph()
    title.alignment = 1
    run = title.add_run("SOFTWARE REQUIREMENTS SPECIFICATION")
    run.bold = True
    run.font.size = Pt(18)
    document.add_paragraph("Movie Hub Website").alignment = 1
    document.add_paragraph("Version 1.0.0").alignment = 1
    document.add_page_break()

    document.add_heading("Revision and Signoff Sheet", level=1)
    document.add_heading("Change Record", level=2)
    add_table(
        document,
        [
            ["Author", "Version", "Change reference", "Date"],
            ["", "0.0.0", "Initial creation and layout organization", ""],
            ["", "1.0.0", "Final revision and format adjusting", ""],
        ],
        [1.8, 1.0, 3.4, 1.0],
    )

    document.add_heading("1 Introduction", level=1)
    document.add_heading("1.1 Purpose", level=2)
    document.add_paragraph(
        "The purpose of this Software Requirements Specification (SRS) document is to provide a detailed description of the functional and non-functional requirements for the Movie Hub system."
    )
    document.add_heading("1.2 Scope", level=2)
    for item in [
        "Browse and search movies currently showing or upcoming at partner cinemas.",
        "View cinema locations with search and filtering capabilities.",
        "Select showtimes with real-time seat availability.",
        "Reserve seats, process payments, receive digital tickets, and manage refunds.",
        "Manage movies, cinemas, halls, showtimes, concessions, promotions, loyalty points, and system configuration.",
    ]:
        document.add_paragraph(item, style="List Bullet")
    document.add_heading("1.3 Intended Audiences and Document Organization", level=2)
    document.add_paragraph("This document is intended for developers, testers, project managers, system architects, stakeholders, and clients.")
    document.add_heading("1.4 References", level=2)
    add_table(
        document,
        [
            ["#", "Title", "Version", "File Name / Link", "Description"],
            ["1", "User Interface", "0.2.0", "", "Demo high fidelity user interface"],
            ["2", "Functional Specs", "1.0.0", "docs/functional_specs", "Detailed module-by-module breakdown"],
        ],
    )

    document.add_section(WD_SECTION.NEW_PAGE)
    document.add_heading("2 Functional Requirements", level=1)
    document.add_heading("2.1 Use Case Description", level=2)
    for idx, module in enumerate(MODULE_ORDER, start=1):
        module_cases = [uc for uc in use_cases if uc.module == module]
        if not module_cases:
            continue
        document.add_heading(f"2.1.{idx} {module.split('_', 1)[1].replace('_', ' ')}", level=3)
        for uc in module_cases:
            add_use_case_to_docx(document, uc)
    document.add_heading("2.2 List Description", level=2)
    document.add_paragraph("N/A")
    document.add_heading("2.3 View Description", level=2)
    document.add_paragraph("N/A")

    document.add_heading("3 Non-functional Requirements", level=1)
    for heading, text in [
        ("3.1 User Access and Security", "The system enforces authentication, authorization, data protection, and secure API access for protected resources."),
        ("3.2 Performance Requirements", "Core browsing, booking, payment, and administration workflows must respond within acceptable operational latency for normal load."),
        ("3.3 Implementation Requirements", "The system is implemented as a service-oriented Movie Hub platform with consistent API contracts, validation, and testing."),
    ]:
        document.add_heading(heading, level=2)
        document.add_paragraph(text)

    document.add_heading("4 Other Requirements", level=1)
    document.add_paragraph("Archive, security audit, site/list configuration, custom page, and technical concerns are managed according to project-level constraints.")

    document.add_heading("5 Appendixes", level=1)
    document.add_heading("5.1 Glossary", level=2)
    add_table(
        document,
        [
            ["Term", "Description"],
            ["BR", "Business Rule"],
            ["DB", "Database"],
            ["MSG", "Message"],
            ["UC", "Use Case"],
            ["SRS", "Software Requirements Specification"],
            ["N/A", "Not Available or Not Applicable"],
        ],
        [1.4, 5.8],
    )
    document.add_heading("5.2 Mapping to Notes Application", level=2)
    document.add_paragraph("There is no mapping between the migrated application and its source Notes application.")
    document.add_heading("5.3 Messages", level=2)
    document.add_paragraph("This section describes the details of messages used in business rules, including error messages, confirmation messages, and success messages.")
    for heading, rows in MESSAGES:
        document.add_heading(heading, level=3)
        add_table(document, [["Code", "Type", "Default Text (English)", "Description"]] + [list(row) for row in rows], [0.8, 1.0, 3.1, 2.6])
    document.add_heading("5.4 Issues List", level=2)
    document.add_paragraph("N/A")

    document.save(DOCX_OUT)


def validate(use_cases: list[UseCase]) -> list[str]:
    errors: list[str] = []
    valid_msgs = {code for _, rows in MESSAGES for code, *_ in rows}
    for uc in use_cases:
        text = uc.path.read_text(encoding="utf-8")
        if "Activity Step | Rule ID" in text:
            errors.append(f"{uc.path}: old BR header remains")
        if "| Activity | BR Code | Description |" not in text:
            errors.append(f"{uc.path}: BDS BR header missing")
        activity_numbers = set(re.findall(r"\((\d+)\)", uc.activity))
        seen: set[str] = set()
        for expected, (activity, br_code, desc) in enumerate(uc.business_rules, start=1):
            num = activity.strip("()")
            if num not in activity_numbers:
                errors.append(f"{uc.path}: {br_code} references missing activity {activity}")
            if br_code in seen:
                errors.append(f"{uc.path}: duplicate {br_code}")
            seen.add(br_code)
            if br_code != f"BR{expected}":
                errors.append(f"{uc.path}: expected local BR{expected}, found {br_code}")
            for msg in re.findall(r"MSG\s+\d+", desc):
                if msg not in valid_msgs:
                    errors.append(f"{uc.path}: {br_code} references undefined {msg}")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rewrite-md", action="store_true")
    parser.add_argument("--build-docx", action="store_true")
    parser.add_argument("--validate", action="store_true")
    args = parser.parse_args()

    use_cases: list[UseCase] = []
    for path in use_case_files():
        uc, _ = parse_use_case(path, 1)
        use_cases.append(uc)

    if args.rewrite_md:
        for uc in use_cases:
            uc.path.write_text(render_md(uc), encoding="utf-8")

    if args.build_docx:
        build_docx(use_cases)

    if args.validate:
        errors = validate(use_cases)
        if errors:
            for error in errors:
                print(error)
            raise SystemExit(1)
        total_rules = sum(len(uc.business_rules) for uc in use_cases)
        print(f"Validated {len(use_cases)} use cases and {total_rules} business rules.")

    total_rules = sum(len(uc.business_rules) for uc in use_cases)
    print(f"Processed {len(use_cases)} use cases. Total BR rows: {total_rules}")


if __name__ == "__main__":
    main()
