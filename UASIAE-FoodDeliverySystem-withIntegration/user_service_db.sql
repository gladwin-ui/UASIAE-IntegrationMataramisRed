-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Waktu pembuatan: 22 Des 2025 pada 20.00
-- Versi server: 10.4.28-MariaDB
-- Versi PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `user_service_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `addresses`
--

CREATE TABLE `addresses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `full_address` text NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('CUSTOMER','ADMIN','DRIVER') DEFAULT 'CUSTOMER',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `created_at`, `updated_at`) VALUES
(1, 'Admin User', 'admin@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567890', 'ADMIN', '2025-12-10 15:09:09', '2025-12-10 15:09:09'),
(2, 'Driver Test', 'driver@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567890', 'DRIVER', '2025-12-10 15:09:09', '2025-12-10 15:09:09'),
(3, 'Driver One', 'driver1@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567891', 'DRIVER', '2025-12-10 15:09:09', '2025-12-10 15:09:09'),
(4, 'Driver Two', 'driver2@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567892', 'DRIVER', '2025-12-10 15:09:09', '2025-12-10 15:09:09'),
(5, 'Customer One', 'customer1@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567893', 'CUSTOMER', '2025-12-10 15:09:09', '2025-12-10 15:09:09'),
(6, 'Customer Two', 'customer2@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567894', 'CUSTOMER', '2025-12-10 15:09:09', '2025-12-10 15:09:09'),
(7, 'Customer Three', 'customer3@example.com', '$2a$10$lV/JwJm0pcWa7R.WP3PVqeCrTfqMb6fTm0TVEbqLunxUU.fUvxX1m', '081234567895', 'CUSTOMER', '2025-12-10 15:09:09', '2025-12-10 15:09:09'),
(15, 'John2 Doe', 'john2@example.com', '$2a$10$22997b.eo95b5izt9jf8xuHXUZICDZXkXXySCfG9v1oUvuglB27CC', '081234567890', 'CUSTOMER', '2025-12-11 09:37:03', '2025-12-11 09:37:03');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `addresses`
--
ALTER TABLE `addresses`
  ADD CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
