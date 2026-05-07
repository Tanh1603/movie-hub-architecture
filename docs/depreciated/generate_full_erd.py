import re
import os

# Configuration
SERVICES = {
    'Booking Service': r'c:\Sem1_Year3_Projects\movie-hub\apps\booking-service\prisma\schema.prisma',
    'User Service': r'c:\Sem1_Year3_Projects\movie-hub\apps\user-service\prisma\schema.prisma',
    'Cinema Service': r'c:\Sem1_Year3_Projects\movie-hub\apps\cinema-service\prisma\schema.prisma',
    'Movie Service': r'c:\Sem1_Year3_Projects\movie-hub\apps\movie-service\prisma\schema.prisma'
}

SCALAR_TYPES = {
    'String', 'Boolean', 'Int', 'Float', 'Decimal', 'DateTime', 'Json', 'Bytes', 'BigInt'
}

# Global registry to help linking: {ModelName: ServiceName}
MODEL_REGISTRY = {}
# To handle duplicates (e.g. Review exists in MovieService and potentially others?), we will prefix model names in the diagram or assume uniqueness.
# Looking at files:
# Booking: Bookings, Tickets, Payments, Refunds, Concessions, BookingConcessions, Promotions, LoyaltyAccounts, LoyaltyTransactions
# Cinema: Cinemas, Halls, Seats, TicketPricing, Showtimes, SeatReservations, CinemaReviews
# Movie: Movie, MovieRelease, Genre, MovieGenre, Review (Note: CinemaReviews vs Review)
# User: Role, Permission, UserRole, RolePermission, Staff, Setting
# Conclusion: 'Review' in MovieService might conflict if not namespaced. But 'CinemaReviews' is distinct.
# We will use "Service_Model" as unique ID in PlantUML, but display as "Model".

def parse_schema(service_name, file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    models = {}
    enums = set()
    
    # helper to strip comments
    def strip_comments(text):
        lines = text.split('\n')
        cleaned = []
        for line in lines:
            if '//' in line:
                line = line.split('//')[0]
            cleaned.append(line)
        return '\n'.join(cleaned)

    content = strip_comments(content)

    # Find enums
    enum_matches = re.finditer(r'enum\s+(\w+)\s+\{', content)
    for match in enum_matches:
        enums.add(match.group(1))

    # Find models
    # We use a simple regex approach. 
    # Disclaimer: heavily nested braces might break this, but Prisma schema is usually regular.
    model_regex = re.compile(r'model\s+(\w+)\s+\{([^\}]+)\}', re.MULTILINE | re.DOTALL)
    
    for match in model_regex.finditer(content):
        model_name = match.group(1)
        body = match.group(2)
        
        MODEL_REGISTRY[model_name] = service_name
        
        fields = []
        relations = []
        
        lines = body.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line: continue
            if line.startswith('@@'): continue 
            
            parts = line.split()
            if len(parts) < 2: continue
            
            field_name = parts[0]
            field_type = parts[1]
            attributes = ' '.join(parts[2:])
            
            # Check for @relation
            # @relation(fields: [x], references: [y])
            relation_match = re.search(r'@relation\((.*?)\)', attributes)
            
            is_scalar = (field_type.replace('?', '').replace('[]', '') in SCALAR_TYPES 
                         or field_type.replace('?', '').replace('[]', '') in enums)
            
            if not is_scalar:
                # It is a relation field (link to another model in THIS file)
                # We store it to draw the line
                target_model = field_type.replace('?', '').replace('[]', '')
                
                # Determine cardinality
                is_array = '[]' in field_type
                is_optional = '?' in field_type
                
                # We only want to draw the relationship from ONE side to avoid duplicates, 
                # or we just collect everything and dedupe later. A common convention is 'fields' arg exists on the 'many' side (or the owning side).
                if 'fields:' in attributes:
                    relations.append({
                        'target': target_model,
                        'is_array': is_array,
                        'is_optional': is_optional
                    })
            
            # We record all fields for the table display
            fields.append({
                'name': field_name,
                'type': field_type,
                'is_pk': '@id' in attributes,
                'is_fk': ('@relation' in attributes or field_name.endswith('Id') or field_name.endswith('_id'))
            })
            
        models[model_name] = {
            'fields': fields,
            'internal_relations': relations
        }
        
    return models

parsed_services = {}

# 1. Parse all
for s_name, f_path in SERVICES.items():
    parsed_services[s_name] = parse_schema(s_name, f_path)

# 2. Generate PlantUML
puml_lines = []
puml_lines.append("@startuml")
puml_lines.append("!theme plain")
puml_lines.append("hide circle")
puml_lines.append("skinparam linetype ortho")

# Definitions
for s_name, models in parsed_services.items():
    puml_lines.append(f'package "{s_name}" {{')
    
    for m_name, m_data in models.items():
        unique_m_name = f"{s_name.replace(' ', '')}_{m_name}" # e.g. BookingService_Bookings
        
        puml_lines.append(f'  entity "{m_name}" as {unique_m_name} {{')
        
        # Keys first
        for f in m_data['fields']:
            if f['is_pk'] or f['is_fk']:
                 puml_lines.append(f'    * {f["name"]} : {f["type"]}')
        
        puml_lines.append('    --')
        
        # Non-keys
        for f in m_data['fields']:
            if not (f['is_pk'] or f['is_fk']):
                 puml_lines.append(f'    {f["name"]} : {f["type"]}')
                 
        puml_lines.append('  }')
        
    puml_lines.append('}')

# External User Entity (Conceptual)
puml_lines.append('package "External / IAM" {')
puml_lines.append('  entity "User" as External_User {')
puml_lines.append('    * id : String')
puml_lines.append('  }')
puml_lines.append('}')


# Relationships
# We need to map ModelName to UniqueName
def get_unique_name(model):
    if model in MODEL_REGISTRY:
        svc = MODEL_REGISTRY[model]
        return f"{svc.replace(' ', '')}_{model}"
    return None

# 1. Internal relationships (Explicit in Prisma)
for s_name, models in parsed_services.items():
    for m_name, m_data in models.items():
        src_unique = f"{s_name.replace(' ', '')}_{m_name}"
        
        for rel in m_data['internal_relations']:
            target_model = rel['target']
            target_unique = get_unique_name(target_model)
            
            if target_unique:
                # Draw line
                # internal usually: OwningSide }o..|| Target (or similar)
                # If current model has 'fields', it holds the FK, so it is the 'Many' side usually.
                puml_lines.append(f'{src_unique} }}o..|| {target_unique}')

# 2. Cross-service relationships (Implicit / Inferred)
# Rules map: FieldNameRegex -> TargetModelName (in a specific service)
# We accept snake_case or camelCase variations.
# (field_pattern, target_service, target_model)
CROSS_LINKS = [
    (r'^(user_?id)$', 'External / IAM', 'User'), # Points to external User
    (r'^(movie_?id)$', 'Movie Service', 'Movie'),
    (r'^(cinema_?id)$', 'Cinema Service', 'Cinemas'),
    (r'^(showtime_?id)$', 'Cinema Service', 'Showtimes'),
    (r'^(hall_?id)$', 'Cinema Service', 'Halls'),
    (r'^(movie_?release_?id)$', 'Movie Service', 'MovieRelease')
]

for s_name, models in parsed_services.items():
    for m_name, m_data in models.items():
        src_unique = f"{s_name.replace(' ', '')}_{m_name}"
        
        for f in m_data['fields']:
            fname = f['name']
            
            for pattern, tgt_svc, tgt_model in CROSS_LINKS:
                if re.match(pattern, fname, re.IGNORECASE):
                    # Found a link!
                    # Check if we are linking to ourselves (internal link already handled)
                    # e.g. CinemaService.Showtimes has cinema_id. We handled this via 'fields' relation internally?
                    # Prisma schema often has BOTH 'cinema_id' Int AND 'cinema' Cinema @relation...
                    # If the relation was already drawn by part 1, we shouldn't draw it again.
                    # How to know? 
                    # Part 1 relies on @relation. 
                    # If this field is PART of a @relation, we skip.
                    
                    # Heuristic: If there is a relation in 'internal_relations' that roughly matches the Type of what we expect, skip.
                    # Actually, simplest is: Only draw cross-service links if the target service is DIFFERENT.
                    
                    if tgt_svc == 'External / IAM':
                         puml_lines.append(f'{src_unique} }}o..|| External_User')
                         continue

                    if tgt_svc != s_name:
                         # Link to other service
                         tgt_unique = f"{tgt_svc.replace(' ', '')}_{tgt_model}"
                         # We blindly assume target exists for now (it should)
                         puml_lines.append(f'{src_unique} }}o..|| {tgt_unique}')

puml_lines.append("@enduml")

print('\n'.join(puml_lines))
