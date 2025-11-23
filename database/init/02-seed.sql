-- Dados de exemplo para desenvolvimento

-- Usuário admin (senha: admin123)
INSERT INTO users (email, password_hash, name, role, plan_type, max_participants)
VALUES (
    'admin@torcida.com',
    crypt('admin123', gen_salt('bf')),
    'Administrador',
    'admin',
    'premium',
    100
);

-- Usuários de teste (senha: test123)
INSERT INTO users (email, password_hash, name)
VALUES
    ('user1@test.com', crypt('test123', gen_salt('bf')), 'João Silva'),
    ('user2@test.com', crypt('test123', gen_salt('bf')), 'Maria Santos'),
    ('user3@test.com', crypt('test123', gen_salt('bf')), 'Pedro Oliveira');

-- Time de exemplo
INSERT INTO teams (name, logo_url, colors)
VALUES (
    'Torcida Exemplo FC',
    'https://via.placeholder.com/150',
    '{"primary": "#FF0000", "secondary": "#FFFFFF"}'
);
