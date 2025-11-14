-- Script to add basketball teams and players to the Brixsport database
-- This script can be run directly against the database

-- First, let's check if the teams already exist to avoid duplicates
-- For this, we'll need to run the insertions in a way that checks for existing records

-- Insert basketball teams
INSERT INTO "Team" (name, short_name, logo_url, founded_year, stadium, city, country, website, colors, sport) VALUES
('TITANS', 'TIT', '/src/assets/titans.jpg', 2010, 'Bells University Arena', 'Bells University of Technology', 'Nigeria', 'https://titans.example.com', '{"primary": "#000000", "secondary": "#FFD700"}', 'BASKETBALL'),
('STORM', 'STM', '/src/assets/the storm.jpg', 2012, 'Bells University Stadium', 'Bells University of Technology', 'Nigeria', 'https://storm.example.com', '{"primary": "#0000FF", "secondary": "#FFFFFF"}', 'BASKETBALL'),
('VIKINGS', 'VKG', '/src/assets/vikings.jpg', 2015, 'Bells University Hall', 'Bells University of Technology', 'Nigeria', 'https://vikings.example.com', '{"primary": "#8B0000", "secondary": "#FFD700"}', 'BASKETBALL'),
('Rim Reapers', 'RIM', '/src/assets/rim-reapers.jpg', 2018, 'Bells University Court', 'Bells University of Technology', 'Nigeria', 'https://rimreapers.example.com', '{"primary": "#228B22", "secondary": "#FFFFFF"}', 'BASKETBALL'),
('Siberia', 'SIB', '', 2016, 'Bells University Gym', 'Bells University of Technology', 'Nigeria', NULL, '{"primary": "#808080", "secondary": "#FFFFFF"}', 'BASKETBALL'),
('TBK', 'TBK', '', 2019, 'Bells University Field', 'Bells University of Technology', 'Nigeria', NULL, '{"primary": "#000000", "secondary": "#FF0000"}', 'BASKETBALL')
ON CONFLICT (name, sport) DO NOTHING;

-- Insert players for TITANS
-- We'll need to get the team ID for each team first
-- This would typically be done with a more complex script or a series of queries

-- For now, let's create a more complete script that can be run with Prisma