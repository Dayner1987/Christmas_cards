-- =========================================================
-- USUARIOS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id_users UUID NOT NULL,

    username VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    first_name VARCHAR(80),
    last_name VARCHAR(80),
    phone VARCHAR(30),
    avatar_url VARCHAR(500),
    biography VARCHAR(500),

    birth_date DATE,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/La_Paz',
    language_code VARCHAR(10) NOT NULL DEFAULT 'es',

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_users
        PRIMARY KEY (id_users),

    CONSTRAINT uk_users_username
        UNIQUE (username),

    CONSTRAINT uk_users_email
        UNIQUE (email),

    CONSTRAINT uk_users_phone
        UNIQUE (phone),

    CONSTRAINT chk_users_status
        CHECK (
            status IN (
                'active',
                'inactive',
                'suspended',
                'deleted'
            )
        )
);


-- =========================================================
-- GRUPOS
-- El enlace de invitación se guarda directamente aquí.
-- =========================================================

CREATE TABLE IF NOT EXISTS groups (
    id_groups UUID NOT NULL,
    id_users_owner UUID NOT NULL,

    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    image_url VARCHAR(500),

    invitation_code VARCHAR(100) NOT NULL,
    invitation_url VARCHAR(700) NOT NULL,

    visibility VARCHAR(20) NOT NULL DEFAULT 'private',
    join_mode VARCHAR(20) NOT NULL DEFAULT 'link',

    maximum_members INTEGER,
    invitation_expires_at TIMESTAMPTZ,
    invitation_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_groups
        PRIMARY KEY (id_groups),

    CONSTRAINT fk_groups_owner
        FOREIGN KEY (id_users_owner)
        REFERENCES users(id_users)
        ON DELETE RESTRICT,

    CONSTRAINT uk_groups_invitation_code
        UNIQUE (invitation_code),

    CONSTRAINT uk_groups_invitation_url
        UNIQUE (invitation_url),

    CONSTRAINT chk_groups_visibility
        CHECK (
            visibility IN ('private', 'public')
        ),

    CONSTRAINT chk_groups_join_mode
        CHECK (
            join_mode IN ('link', 'approval', 'closed')
        ),

    CONSTRAINT chk_groups_status
        CHECK (
            status IN ('active', 'archived', 'deleted')
        ),

    CONSTRAINT chk_groups_maximum_members
        CHECK (
            maximum_members IS NULL
            OR maximum_members > 1
        )
);


-- =========================================================
-- MIEMBROS DE LOS GRUPOS
-- =========================================================

CREATE TABLE IF NOT EXISTS group_members (
    id_group_members UUID NOT NULL,
    id_groups UUID NOT NULL,
    id_users UUID NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'member',
    membership_status VARCHAR(20) NOT NULL DEFAULT 'active',
    joined_by VARCHAR(30) NOT NULL DEFAULT 'invitation_link',

    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_group_members
        PRIMARY KEY (id_group_members),

    CONSTRAINT fk_group_members_groups
        FOREIGN KEY (id_groups)
        REFERENCES groups(id_groups)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_members_users
        FOREIGN KEY (id_users)
        REFERENCES users(id_users)
        ON DELETE CASCADE,

    CONSTRAINT uk_group_members_group_user
        UNIQUE (id_groups, id_users),

    CONSTRAINT chk_group_members_role
        CHECK (
            role IN ('owner', 'admin', 'member')
        ),

    CONSTRAINT chk_group_members_status
        CHECK (
            membership_status IN (
                'pending',
                'active',
                'rejected',
                'left',
                'removed'
            )
        ),

    CONSTRAINT chk_group_members_joined_by
        CHECK (
            joined_by IN (
                'owner',
                'invitation_link',
                'direct_invitation'
            )
        )
);

-- =========================================================
-- LISTAS DE DESEOS
-- =========================================================

CREATE TABLE IF NOT EXISTS wishlists (
    id_wishlists UUID NOT NULL,
    id_users UUID NOT NULL,

    name VARCHAR(100) NOT NULL DEFAULT 'Mi lista de deseos',
    description VARCHAR(500),

    visibility VARCHAR(20) NOT NULL DEFAULT 'groups',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_wishlists
        PRIMARY KEY (id_wishlists),

    CONSTRAINT fk_wishlists_users
        FOREIGN KEY (id_users)
        REFERENCES users(id_users)
        ON DELETE CASCADE,

    CONSTRAINT chk_wishlists_visibility
        CHECK (
            visibility IN ('private', 'groups', 'public')
        ),

    CONSTRAINT chk_wishlists_status
        CHECK (
            status IN ('active', 'archived')
        )
);


-- Cada usuario solamente puede tener una lista predeterminada.

CREATE UNIQUE INDEX IF NOT EXISTS uk_wishlists_default_user
    ON wishlists (id_users)
    WHERE is_default = TRUE;


-- =========================================================
-- ELEMENTOS DE LAS LISTAS DE DESEOS
-- =========================================================

CREATE TABLE IF NOT EXISTS wishlist_items (
    id_wishlist_items UUID NOT NULL,
    id_wishlists UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    description VARCHAR(700),

    product_url VARCHAR(1000),
    image_url VARCHAR(1000),

    estimated_price NUMERIC(12, 2),
    currency_code CHAR(3) NOT NULL DEFAULT 'BOB',

    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    quantity SMALLINT NOT NULL DEFAULT 1,
    is_received BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_wishlist_items
        PRIMARY KEY (id_wishlist_items),

    CONSTRAINT fk_wishlist_items_wishlists
        FOREIGN KEY (id_wishlists)
        REFERENCES wishlists(id_wishlists)
        ON DELETE CASCADE,

    CONSTRAINT chk_wishlist_items_price
        CHECK (
            estimated_price IS NULL
            OR estimated_price >= 0
        ),

    CONSTRAINT chk_wishlist_items_priority
        CHECK (
            priority IN ('low', 'medium', 'high')
        ),

    CONSTRAINT chk_wishlist_items_quantity
        CHECK (quantity > 0)
);


-- =========================================================
-- DISEÑOS O PLANTILLAS DE TARJETAS
-- =========================================================

CREATE TABLE IF NOT EXISTS cards (
    id_cards UUID NOT NULL,
    id_users_creator UUID,

    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),

    front_image_url VARCHAR(1000) NOT NULL,
    background_image_url VARCHAR(1000),
    preview_image_url VARCHAR(1000),

    category VARCHAR(30) NOT NULL DEFAULT 'christmas',

    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_cards
        PRIMARY KEY (id_cards),

    CONSTRAINT fk_cards_creator
        FOREIGN KEY (id_users_creator)
        REFERENCES users(id_users)
        ON DELETE SET NULL,

    CONSTRAINT chk_cards_category
        CHECK (
            category IN (
                'christmas',
                'new_year',
                'secret_santa',
                'custom'
            )
        )
);


-- =========================================================
-- TARJETAS ENVIADAS
-- =========================================================

CREATE TABLE IF NOT EXISTS user_cards (
    id_user_cards UUID NOT NULL,
    id_cards UUID NOT NULL,

    id_users_sender UUID NOT NULL,
    id_users_recipient UUID NOT NULL,
    id_groups UUID,

    title VARCHAR(150),
    message TEXT NOT NULL,

    sender_name VARCHAR(120),
    recipient_name VARCHAR(120),

    delivery_channel VARCHAR(20) NOT NULL DEFAULT 'application',
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'draft',

    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_user_cards
        PRIMARY KEY (id_user_cards),

    CONSTRAINT fk_user_cards_cards
        FOREIGN KEY (id_cards)
        REFERENCES cards(id_cards)
        ON DELETE RESTRICT,

    CONSTRAINT fk_user_cards_sender
        FOREIGN KEY (id_users_sender)
        REFERENCES users(id_users)
        ON DELETE RESTRICT,

    CONSTRAINT fk_user_cards_recipient
        FOREIGN KEY (id_users_recipient)
        REFERENCES users(id_users)
        ON DELETE RESTRICT,

    CONSTRAINT fk_user_cards_groups
        FOREIGN KEY (id_groups)
        REFERENCES groups(id_groups)
        ON DELETE SET NULL,

    CONSTRAINT chk_user_cards_different_users
        CHECK (
            id_users_sender <> id_users_recipient
        ),

    CONSTRAINT chk_user_cards_delivery_channel
        CHECK (
            delivery_channel IN (
                'application',
                'whatsapp',
                'email',
                'link'
            )
        ),

    CONSTRAINT chk_user_cards_delivery_status
        CHECK (
            delivery_status IN (
                'draft',
                'scheduled',
                'sent',
                'delivered',
                'read',
                'cancelled'
            )
        )
);


-- =========================================================
-- EVENTOS O PARTIDAS DE AMIGO SECRETO
-- =========================================================

CREATE TABLE IF NOT EXISTS secret_santa_events (
    id_secret_santa_events UUID NOT NULL,
    id_groups UUID NOT NULL,
    id_users_creator UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    description VARCHAR(700),

    minimum_budget NUMERIC(12, 2),
    maximum_budget NUMERIC(12, 2),
    currency_code CHAR(3) NOT NULL DEFAULT 'BOB',

    registration_deadline TIMESTAMPTZ,
    draw_date TIMESTAMPTZ,
    gift_delivery_date TIMESTAMPTZ,

    allow_repeated_pairs BOOLEAN NOT NULL DEFAULT FALSE,
    reveal_secret_santa BOOLEAN NOT NULL DEFAULT FALSE,

    status VARCHAR(20) NOT NULL DEFAULT 'draft',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_secret_santa_events
        PRIMARY KEY (id_secret_santa_events),

    CONSTRAINT fk_secret_santa_events_groups
        FOREIGN KEY (id_groups)
        REFERENCES groups(id_groups)
        ON DELETE CASCADE,

    CONSTRAINT fk_secret_santa_events_creator
        FOREIGN KEY (id_users_creator)
        REFERENCES users(id_users)
        ON DELETE RESTRICT,

    CONSTRAINT chk_secret_santa_events_status
        CHECK (
            status IN (
                'draft',
                'registration',
                'drawn',
                'completed',
                'cancelled'
            )
        ),

    CONSTRAINT chk_secret_santa_minimum_budget
        CHECK (
            minimum_budget IS NULL
            OR minimum_budget >= 0
        ),

    CONSTRAINT chk_secret_santa_maximum_budget
        CHECK (
            maximum_budget IS NULL
            OR maximum_budget >= 0
        ),

    CONSTRAINT chk_secret_santa_budget_range
        CHECK (
            minimum_budget IS NULL
            OR maximum_budget IS NULL
            OR maximum_budget >= minimum_budget
        ),

    CONSTRAINT chk_secret_santa_event_dates
        CHECK (
            registration_deadline IS NULL
            OR draw_date IS NULL
            OR registration_deadline <= draw_date
        ),

    CONSTRAINT chk_secret_santa_delivery_date
        CHECK (
            draw_date IS NULL
            OR gift_delivery_date IS NULL
            OR draw_date <= gift_delivery_date
        )
);


-- =========================================================
-- PARTICIPANTES DEL AMIGO SECRETO
-- =========================================================

CREATE TABLE IF NOT EXISTS secret_santa_participants (
    id_secret_santa_participants UUID NOT NULL,
    id_secret_santa_events UUID NOT NULL,
    id_users UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'invited',

    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_secret_santa_participants
        PRIMARY KEY (id_secret_santa_participants),

    CONSTRAINT fk_secret_santa_participants_events
        FOREIGN KEY (id_secret_santa_events)
        REFERENCES secret_santa_events(id_secret_santa_events)
        ON DELETE CASCADE,

    CONSTRAINT fk_secret_santa_participants_users
        FOREIGN KEY (id_users)
        REFERENCES users(id_users)
        ON DELETE CASCADE,

    CONSTRAINT uk_secret_santa_participants_event_user
        UNIQUE (id_secret_santa_events, id_users),

    CONSTRAINT chk_secret_santa_participants_status
        CHECK (
            status IN (
                'invited',
                'accepted',
                'rejected',
                'withdrawn'
            )
        )
);


-- =========================================================
-- EXCLUSIONES DEL SORTEO
-- Impide determinadas combinaciones.
-- =========================================================

CREATE TABLE IF NOT EXISTS secret_santa_exclusions (
    id_secret_santa_exclusions UUID NOT NULL,
    id_secret_santa_events UUID NOT NULL,

    id_users_giver UUID NOT NULL,
    id_users_excluded_receiver UUID NOT NULL,

    reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_secret_santa_exclusions
        PRIMARY KEY (id_secret_santa_exclusions),

    CONSTRAINT fk_secret_santa_exclusions_giver
        FOREIGN KEY (
            id_secret_santa_events,
            id_users_giver
        )
        REFERENCES secret_santa_participants (
            id_secret_santa_events,
            id_users
        )
        ON DELETE CASCADE,

    CONSTRAINT fk_secret_santa_exclusions_receiver
        FOREIGN KEY (
            id_secret_santa_events,
            id_users_excluded_receiver
        )
        REFERENCES secret_santa_participants (
            id_secret_santa_events,
            id_users
        )
        ON DELETE CASCADE,

    CONSTRAINT uk_secret_santa_exclusions_pair
        UNIQUE (
            id_secret_santa_events,
            id_users_giver,
            id_users_excluded_receiver
        ),

    CONSTRAINT chk_secret_santa_exclusions_users
        CHECK (
            id_users_giver <> id_users_excluded_receiver
        )
);


-- =========================================================
-- RESULTADOS DEL SORTEO
-- Cada participante entrega y recibe exactamente un regalo.
-- =========================================================

CREATE TABLE IF NOT EXISTS secret_santa_assignments (
    id_secret_santa_assignments UUID NOT NULL,
    id_secret_santa_events UUID NOT NULL,

    id_users_giver UUID NOT NULL,
    id_users_receiver UUID NOT NULL,

    private_message VARCHAR(700),

    gift_status VARCHAR(20) NOT NULL DEFAULT 'pending',

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMPTZ,

    CONSTRAINT pk_secret_santa_assignments
        PRIMARY KEY (id_secret_santa_assignments),

    CONSTRAINT fk_secret_santa_assignments_giver
        FOREIGN KEY (
            id_secret_santa_events,
            id_users_giver
        )
        REFERENCES secret_santa_participants (
            id_secret_santa_events,
            id_users
        )
        ON DELETE CASCADE,

    CONSTRAINT fk_secret_santa_assignments_receiver
        FOREIGN KEY (
            id_secret_santa_events,
            id_users_receiver
        )
        REFERENCES secret_santa_participants (
            id_secret_santa_events,
            id_users
        )
        ON DELETE CASCADE,

    CONSTRAINT uk_secret_santa_assignments_giver
        UNIQUE (
            id_secret_santa_events,
            id_users_giver
        ),

    CONSTRAINT uk_secret_santa_assignments_receiver
        UNIQUE (
            id_secret_santa_events,
            id_users_receiver
        ),

    CONSTRAINT chk_secret_santa_assignments_users
        CHECK (
            id_users_giver <> id_users_receiver
        ),

    CONSTRAINT chk_secret_santa_assignments_gift_status
        CHECK (
            gift_status IN (
                'pending',
                'purchased',
                'delivered'
            )
        )
);


-- =========================================================
-- NOTIFICACIONES
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    id_notifications UUID NOT NULL,
    id_users UUID NOT NULL,

    notification_type VARCHAR(40) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(700) NOT NULL,

    reference_type VARCHAR(50),
    reference_id UUID,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_notifications
        PRIMARY KEY (id_notifications),

    CONSTRAINT fk_notifications_users
        FOREIGN KEY (id_users)
        REFERENCES users(id_users)
        ON DELETE CASCADE,

    CONSTRAINT chk_notifications_type
        CHECK (
            notification_type IN (
                'group_invitation',
                'group_join_request',
                'group_member_added',
                'card_received',
                'secret_santa_invitation',
                'secret_santa_draw',
                'secret_santa_reminder',
                'system'
            )
        ),

    CONSTRAINT chk_notifications_read
        CHECK (
            (is_read = FALSE AND read_at IS NULL)
            OR is_read = TRUE
        )
);


-- =========================================================
-- BLOQUEOS ENTRE USUARIOS
-- =========================================================

CREATE TABLE IF NOT EXISTS user_blocks (
    id_user_blocks UUID NOT NULL,

    id_users_blocker UUID NOT NULL,
    id_users_blocked UUID NOT NULL,

    reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_user_blocks
        PRIMARY KEY (id_user_blocks),

    CONSTRAINT fk_user_blocks_blocker
        FOREIGN KEY (id_users_blocker)
        REFERENCES users(id_users)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_blocks_blocked
        FOREIGN KEY (id_users_blocked)
        REFERENCES users(id_users)
        ON DELETE CASCADE,

    CONSTRAINT uk_user_blocks_users
        UNIQUE (
            id_users_blocker,
            id_users_blocked
        ),

    CONSTRAINT chk_user_blocks_different_users
        CHECK (
            id_users_blocker <> id_users_blocked
        )
);


-- =========================================================
-- ÍNDICES PARA CONSULTAS FRECUENTES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_groups_owner
    ON groups (id_users_owner);

CREATE INDEX IF NOT EXISTS idx_group_members_users
    ON group_members (id_users);

CREATE INDEX IF NOT EXISTS idx_group_members_status
    ON group_members (id_groups, membership_status);

CREATE INDEX IF NOT EXISTS idx_group_invitations_group_status
    ON group_invitations (id_groups, status);

CREATE INDEX IF NOT EXISTS idx_wishlists_users
    ON wishlists (id_users);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlists
    ON wishlist_items (id_wishlists);

CREATE INDEX IF NOT EXISTS idx_cards_category_active
    ON cards (category, is_active);

CREATE INDEX IF NOT EXISTS idx_user_cards_sender
    ON user_cards (id_users_sender);

CREATE INDEX IF NOT EXISTS idx_user_cards_recipient_status
    ON user_cards (id_users_recipient, delivery_status);

CREATE INDEX IF NOT EXISTS idx_secret_santa_events_group_status
    ON secret_santa_events (id_groups, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON notifications (id_users, is_read);