import re
import os

files = [
    r'c:\Sem1_Year3_Projects\movie-hub\apps\booking-service\prisma\schema.prisma',
    r'c:\Sem1_Year3_Projects\movie-hub\apps\user-service\prisma\schema.prisma',
    r'c:\Sem1_Year3_Projects\movie-hub\apps\cinema-service\prisma\schema.prisma',
    r'c:\Sem1_Year3_Projects\movie-hub\apps\movie-service\prisma\schema.prisma'
]

SCALAR_TYPES = {
    'String', 'Boolean', 'Int', 'Float', 'Decimal', 'DateTime', 'Json', 'Bytes', 'BigInt'
}

def parse_model(content):
    models = {}
    enums = set()
    
    # First find all enums to treat them as scalars
    enum_matches = re.finditer(r'enum\s+(\w+)\s+\{', content)
    for match in enum_matches:
        enums.add(match.group(1))

    # Regex for models
    model_regex = re.compile(r'model\s+(\w+)\s+\{([^\}]+)\}', re.MULTILINE | re.DOTALL)
    
    for match in model_regex.finditer(content):
        model_name = match.group(1)
        body = match.group(2)
        
        fields = []
        keys = set()
        
        # Parse body lines
        lines = body.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line or line.startswith('//'):
                continue
                
            # Block attributes
            if line.startswith('@@'):
                # Extract fields from @@index([f1, f2]), @@unique, @@id
                # simplified extraction
                inner = re.search(r'\[(.*?)\]', line)
                if inner:
                    attr_fields = [f.strip() for f in inner.group(1).split(',')]
                    for f in attr_fields:
                        keys.add(f)
                continue
            
            # Field parsing
            # name type optional attributes
            # e.g. id String @id @default(...)
            parts = line.split()
            if len(parts) < 2:
                continue
                
            name = parts[0]
            type_str = parts[1]
            rest = ' '.join(parts[2:])
            
            # Check if scalar or enum
            # remove ? or [] from type for check
            base_type = type_str.replace('?', '').replace('[]', '')
            
            is_scalar = base_type in SCALAR_TYPES or base_type in enums
            
            if not is_scalar:
                # Likely a relation field, we skip for the table view essentially
                # UNLESS it's an enum we missed?
                # But we collected enums.
                # If it is a Model, we skip.
                continue
                
            is_key = False
            if '@id' in rest or '@unique' in rest:
                is_key = True
            
            if name.endswith('Id') or name.endswith('_id'): # Heuristic for FKs
                is_key = True
                
            fields.append({
                'name': name,
                'type': type_str,
                'is_key': is_key,
                'attrs': rest
            })
            
        models[model_name] = {'fields': fields, 'keys': keys}
        
    return models

def generate_plantuml(models):
    output = []
    for model_name, data in models.items():
        output.append(f'package "{model_name}" <<Rectangle>> {{') # Using package just to group if needed, but actually simple class is better
        # Actually image shows just a class/entity box.
        output.pop() 
        
        output.append(f'entity {model_name} {{')
        
        # Split into keys and non-keys
        key_fields = []
        normal_fields = []
        
        field_names = [f['name'] for f in data['fields']]
        explicit_keys = data['keys']
        
        for f in data['fields']:
            # It is a key if: marked is_key OR present in explicit_keys
            if f['is_key'] or f['name'] in explicit_keys:
                key_fields.append(f)
            else:
                normal_fields.append(f)
                
        # Draw keys
        for f in key_fields:
            output.append(f'  o {f["name"]}: {f["type"]}')
            
        if key_fields and normal_fields:
            output.append('  --')
            
        # Draw normal
        for f in normal_fields:
            output.append(f'  {f["name"]}: {f["type"]}')
            
        output.append('}\n')
        
    return '\n'.join(output)

for file_path in files:
    print(f"--- File: {os.path.basename(file_path)} ---")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            models = parse_model(content)
            puml = generate_plantuml(models)
            print(puml)
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

