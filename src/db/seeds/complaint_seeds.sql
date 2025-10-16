-- Insert test complaints
INSERT INTO complaints (child_id, subject, recipient, description, date, status, action)
VALUES 
  (1, 'Behavioral Issue', 'teacher', 'Child has been displaying disruptive behavior during class activities', CURRENT_DATE, 'pending', NULL),
  (1, 'Health Concern', 'supervisor', 'Child complained of stomach pain during lunch', CURRENT_DATE - INTERVAL '1 day', 'investigating', 'Nurse has been notified and monitoring situation'),
  (2, 'Academic Progress', 'teacher', 'Concerned about child''s participation in reading activities', CURRENT_DATE - INTERVAL '2 days', 'resolved', 'Additional reading support provided during afternoon sessions'),
  (3, 'Safety Concern', 'supervisor', 'Noticed playground equipment needs maintenance', CURRENT_DATE - INTERVAL '3 days', 'resolved', 'Equipment has been repaired and safety check completed');