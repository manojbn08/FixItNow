-- Seed data for H2 in-memory database
-- Converted from database/fixitnow.sql (MySQL dump) to H2-compatible syntax

-- =====================
-- USERS
-- =====================
INSERT INTO users (id, approval_status, created_at, email, id_proof_document_name, id_proof_type, is_active, wallet_balance, location, name, password, phone, role, service_type, updated_at) VALUES
(1, 'APPROVED', TIMESTAMP '2026-03-05 20:39:01.352949', 'admin@example.com', NULL, NULL, TRUE, 0.00, NULL, 'Admin User', '$2a$10$3.AupDpUEyVAES8oGl7.v.4kUkbDCYQi9/7ZsWFIsyPKwZPopZBKa', NULL, 'ADMIN', NULL, TIMESTAMP '2026-03-05 20:39:01.352949');

INSERT INTO users (id, approval_status, created_at, email, id_proof_document_name, id_proof_type, is_active, wallet_balance, location, name, password, phone, role, service_type, updated_at) VALUES
(2, 'APPROVED', TIMESTAMP '2026-03-05 20:39:35.959151', 'alice456@gmail.com', 'AADHAR_12345678', 'AADHAR', TRUE, 0.00, 'New York, NY', 'Alice', '$2a$10$E.Fc/h4F5e2GQG49nB4m6evlsxBqxgWQVVOsjWV5DADIUM5P88qbO', '+1-555-5678', 'PROVIDER', 'Electrical', TIMESTAMP '2026-03-05 20:39:35.959151');

INSERT INTO users (id, approval_status, created_at, email, id_proof_document_name, id_proof_type, is_active, wallet_balance, location, name, password, phone, role, service_type, updated_at) VALUES
(3, 'APPROVED', TIMESTAMP '2026-03-05 20:40:04.141913', 'john456@gmail.com', NULL, NULL, TRUE, 0.00, 'New York, NY', 'John', '$2a$10$B10dwI07b.dQuA510kygEOCoEEd6QsLhnXKyaPYvj8gE4dAyQPZGu', '+1-555-1234', 'CUSTOMER', NULL, TIMESTAMP '2026-03-05 20:40:04.141913');

INSERT INTO users (id, approval_status, created_at, email, id_proof_document_name, id_proof_type, is_active, wallet_balance, location, name, password, phone, role, service_type, updated_at) VALUES
(4, 'APPROVED', TIMESTAMP '2026-03-06 11:02:00.296029', 'bob456@gmail.com', 'AADHAR_999999', 'AADHAR', TRUE, 0.00, 'New York, NY', 'Bob', '$2a$10$MOs1is2TOe03JJTyVvK77.NsdWIXFwyaHOOFnpD023gW0wod1guwy', '+1-555-2222', 'PROVIDER', 'Plumbing', TIMESTAMP '2026-03-06 11:02:00.296029');

INSERT INTO users (id, approval_status, created_at, email, id_proof_document_name, id_proof_type, is_active, wallet_balance, location, name, password, phone, role, service_type, updated_at) VALUES
(5, 'APPROVED', TIMESTAMP '2026-03-06 11:08:42.105967', 'charlie456@gmail.com', 'AADHAR_888888', 'AADHAR', TRUE, 0.00, 'New York, NY', 'Charlie', '$2a$10$zrllL7B9fjUNfmvcFEzTG.AQ1tItMzcciYWx6FXqXOjQuD598T.Fi', '+1-555-3333', 'PROVIDER', 'Plumbing', TIMESTAMP '2026-03-06 11:08:42.105967');

-- =====================
-- CATEGORIES
-- =====================
INSERT INTO categories (id, description, icon, name) VALUES
(1, 'Electrical repair and installation services', '⚡', 'Electrical');

INSERT INTO categories (id, description, icon, name) VALUES
(2, 'Plumbing and water system services', '💧', 'Plumbing');

INSERT INTO categories (id, description, icon, name) VALUES
(3, 'Woodwork and furniture services', '🪚', 'Carpentry');

-- =====================
-- SUBCATEGORIES
-- =====================
INSERT INTO subcategories (id, name, category_id) VALUES
(1, 'Fan Repair / Installation', 1);

INSERT INTO subcategories (id, name, category_id) VALUES
(2, 'Light Fixture Installation', 1);

INSERT INTO subcategories (id, name, category_id) VALUES
(3, 'Switch / Socket Repair', 1);

INSERT INTO subcategories (id, name, category_id) VALUES
(4, 'Leakage Repair', 2);

INSERT INTO subcategories (id, name, category_id) VALUES
(5, 'Tap / Mixer Installation', 2);

INSERT INTO subcategories (id, name, category_id) VALUES
(6, 'Toilet / Flush Tank Repair', 2);

INSERT INTO subcategories (id, name, category_id) VALUES
(7, 'Furniture Repair (Chair, Table, Sofa)', 3);

INSERT INTO subcategories (id, name, category_id) VALUES
(8, 'Door / Window Repair', 3);

INSERT INTO subcategories (id, name, category_id) VALUES
(9, 'Wooden Cabinet / Wardrobe Repair', 3);

-- =====================
-- SERVICES
-- =====================
INSERT INTO services (id, availability, average_rating, category, created_at, description, latitude, location, longitude, price, review_count, subcategory, provider_id, duration_minutes) VALUES
(1, 'Mon-Sat 9AM-6PM', 5.00, 'Electrical', TIMESTAMP '2026-03-06 11:21:23.164299', 'Professional fan repair and installation for ceiling fans, pedestal fans, and exhaust fans. Quick diagnosis and reliable service.', 40.71280000, 'New York, NY', -74.00600000, 450.00, 1, 'Fan Repair / Installation', 2, 0);

INSERT INTO services (id, availability, average_rating, category, created_at, description, latitude, location, longitude, price, review_count, subcategory, provider_id, duration_minutes) VALUES
(2, 'Mon-Sat 9AM-6PM', 0.00, 'Electrical', TIMESTAMP '2026-03-06 11:22:27.616638', 'Professional light fixture installation for residential and commercial properties. We ensure safe and efficient lighting solutions.', 40.71280000, 'New York, NY', -74.00600000, 450.00, 0, 'Light Fixture Installation', 2, 0);

INSERT INTO services (id, availability, average_rating, category, created_at, description, latitude, location, longitude, price, review_count, subcategory, provider_id, duration_minutes) VALUES
(3, 'Mon-Sat 10AM-7PM', 0.00, 'Plumbing', TIMESTAMP '2026-03-06 11:24:32.839539', 'Fix leaking pipes, taps, and valves. Our plumbers ensure durable repairs with quality fittings.', 40.71500000, 'New York, NY', -74.00300000, 700.00, 0, 'Leakage Repair', 4, 0);

INSERT INTO services (id, availability, average_rating, category, created_at, description, latitude, location, longitude, price, review_count, subcategory, provider_id, duration_minutes) VALUES
(4, 'Mon-Fri 9AM-5PM', 0.00, 'Carpentry', TIMESTAMP '2026-03-06 12:14:53.810564', 'Repair and restoration of wooden furniture including chairs, tables, wardrobes, and sofas.', 40.72000000, 'New York, NY', -74.00000000, 550.00, 0, 'Furniture Repair (Chair, Table, Sofa)', 5, 0);

INSERT INTO services (id, availability, average_rating, category, created_at, description, latitude, location, longitude, price, review_count, subcategory, provider_id, duration_minutes) VALUES
(5, 'Mon-Fri 9AM-5PM', 0.00, 'Carpentry', TIMESTAMP '2026-03-06 12:16:06.746901', 'Repair and restoration of wooden furniture including chairs, tables, wardrobes, and sofas.', 40.72000000, 'New York, NY', -74.00000000, 550.00, 0, 'Door / Window Repair', 5, 0);

INSERT INTO services (id, availability, average_rating, category, created_at, description, latitude, location, longitude, price, review_count, subcategory, provider_id, duration_minutes) VALUES
(6, 'Mon-Fri 9AM-6PM, Sat 10AM-4PM', 0.00, 'Electrical', TIMESTAMP '2026-03-12 16:14:16.978037', 'Professional fan repair and installation services for all types of fans. We fix motor issues, blade problems, and wiring concerns to ensure your fan runs efficiently.', 40.71280000, 'New York, NY', -74.00600000, 500.00, 0, 'Fan Repair / Installation', 4, 120);

-- =====================
-- BOOKINGS
-- =====================
INSERT INTO bookings (id, booking_date, created_at, status, time_slot, customer_id, provider_id, service_id) VALUES
(1, DATE '2024-03-25', TIMESTAMP '2026-03-11 16:27:25.727628', 'COMPLETED', '09:00:00 - 11:00:00', 3, 2, 1);

INSERT INTO bookings (id, booking_date, created_at, status, time_slot, customer_id, provider_id, service_id) VALUES
(2, DATE '2024-03-13', TIMESTAMP '2026-03-12 16:24:10.569317', 'COMPLETED', '09:00:00 - 11:00:00', 3, 2, 1);

INSERT INTO bookings (id, booking_date, created_at, status, time_slot, customer_id, provider_id, service_id) VALUES
(3, DATE '2024-03-25', TIMESTAMP '2026-03-12 16:39:50.007951', 'CANCELLED', '09:00:00 - 10:00:00', 3, 2, 1);

INSERT INTO bookings (id, booking_date, created_at, status, time_slot, customer_id, provider_id, service_id) VALUES
(4, DATE '2026-03-20', TIMESTAMP '2026-03-14 13:26:21.375297', 'COMPLETED', '09:00 - 11:00', 3, 2, 1);

INSERT INTO bookings (id, booking_date, created_at, status, time_slot, customer_id, provider_id, service_id) VALUES
(5, DATE '2024-03-25', TIMESTAMP '2026-03-14 15:53:52.386905', 'COMPLETED', '09:00:00 - 11:00:00', 3, 4, 6);

-- =====================
-- REVIEWS
-- =====================
INSERT INTO reviews (id, comment, created_at, rating, updated_at, customer_id, provider_id, service_id) VALUES
(1, 'Excellent service! Alice was very professional and thorough. The cleaning was perfect and she arrived on time. Highly recommend!', TIMESTAMP '2026-03-06 12:49:48.496080', 5, TIMESTAMP '2026-03-06 12:49:48.496080', 3, 2, 1);

-- =====================
-- REVIEW NOTIFICATIONS
-- =====================
INSERT INTO review_notifications (id, created_at, is_read, read_at, customer_id, provider_id, review_id) VALUES
(1, TIMESTAMP '2026-03-06 12:49:48.496080', FALSE, TIMESTAMP '2026-03-06 12:55:12.000000', 3, 2, 1);

-- =====================
-- CHAT MESSAGES
-- =====================
INSERT INTO chat_messages (id, content, sent_at, booking_id, receiver_id, sender_id) VALUES
(1, 'Hi, I have some questions about the service', TIMESTAMP '2026-03-14 15:58:04.622455', 5, 4, 3);

INSERT INTO chat_messages (id, content, sent_at, booking_id, receiver_id, sender_id) VALUES
(2, 'yeah, you can ask me anything about the service', TIMESTAMP '2026-03-14 15:59:24.239452', 5, 3, 4);

INSERT INTO chat_messages (id, content, sent_at, booking_id, receiver_id, sender_id) VALUES
(3, 'the service is completed successfully', TIMESTAMP '2026-03-14 16:03:19.145188', 5, 3, 4);
