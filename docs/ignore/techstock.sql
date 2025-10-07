-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 06, 2025 at 04:19 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `techstock`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `name`, `isActive`) VALUES
(2, 'Demo Category 2', 1),
(3, 'Laptops', 1),
(4, 'Desktops', 1),
(5, 'Monitors', 1),
(6, 'Keyboards', 1),
(7, 'Mouses', 1),
(8, 'Smartphones', 1),
(9, 'Aux2', 0),
(11, 'Radios12', 1),
(12, 'Joax', 1);

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `message`, `created_at`, `updated_at`) VALUES
(1, 'Yamen Rock', 'yamen.rock@gmail.com', 'test', '2025-08-04 05:29:10', '2025-08-04 05:29:10'),
(2, 'Yamen Rock', 'dev.ocean159@gmail.com', '234234f', '2025-08-04 05:43:28', '2025-08-04 05:43:28'),
(3, 'Yamen Rock', 'yamen.rock@gmail.com', 'ewrwer', '2025-08-04 06:26:33', '2025-08-04 06:26:33'),
(4, 'GYH Real Estate', 'info@gyhdubai.com', 'sdfsdf', '2025-09-05 23:31:36', '2025-09-05 23:31:36'),
(5, 'Yamen Rock', 'yamen.rock@gmail.com', 'test', '2025-09-06 14:08:23', '2025-09-06 14:08:23'),
(6, 'Yamen Rock', 'yamen.rock@gmail.com', 'test', '2025-09-06 14:09:23', '2025-09-06 14:09:23');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `shipping_address` text DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `promotion_id` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `order_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `total_amount`, `shipping_address`, `payment_method`, `promotion_id`, `status`, `order_date`) VALUES
(1, 5, 8912.00, NULL, NULL, NULL, 'Shipped', '2025-06-22 06:01:47'),
(2, 1, 22500.00, NULL, NULL, NULL, 'Processing', '2025-06-22 07:41:03'),
(3, 1, 19400.00, 'Nazareth', 'credit_card', NULL, 'Shipped', '2025-06-22 09:14:29'),
(4, 1, 19400.00, 'sfcsdfsdf', 'paypal', NULL, 'pending', '2025-06-22 09:17:01'),
(5, 1, 10500.00, 'etyerytrety', 'credit_card', NULL, 'pending', '2025-06-22 09:21:25'),
(6, 1, 19200.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-06-22 09:24:17'),
(7, 1, 4345.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-06-22 09:28:06'),
(8, 6, 10500.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-06-22 09:33:07'),
(9, 6, 22801.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-06-22 09:37:16'),
(10, 1, 14080.00, 'Nazareth', 'credit_card', 1, 'pending', '2025-06-22 09:48:35'),
(11, 1, 17900.00, 'sfcsdfsdf', 'credit_card', NULL, 'pending', '2025-06-23 09:39:40'),
(12, 9, 17900.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-08-03 14:54:27'),
(13, 1, 4345.00, 'Nazareth', 'credit_card', NULL, 'Processing', '2025-08-03 15:43:49'),
(14, 1, 9000.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-08-03 15:49:12'),
(15, 1, 1500.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-08-03 15:52:39'),
(16, 1, 12000.00, 'Nazareth', 'credit_card', NULL, 'Processing', '2025-08-03 15:57:07'),
(17, 1, 53395.00, 'Haifa', 'credit_card', 5, 'pending', '2025-08-04 04:32:31'),
(18, 1, 10330.00, 'Nazareth', 'credit_card', 5, 'pending', '2025-08-04 05:15:04'),
(19, 11, 10195.00, 'Nazareth', 'credit_card', 5, 'pending', '2025-08-04 05:31:23'),
(20, 12, 4300.00, 'Nazareth', 'credit_card', NULL, 'Processing', '2025-08-04 05:40:33'),
(21, 1, 301.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-08-04 06:21:06'),
(22, 1, 313.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-08-04 06:24:55'),
(23, 1, 57.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-08-26 05:55:34'),
(24, 1, 619.20, 'Nof Hagaill', 'credit_card', 6, 'pending', '2025-09-05 22:41:27');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `quantity`, `price`) VALUES
(1, 1, 12, 1, 8900.00),
(2, 1, 20, 1, 12.00),
(3, 2, 13, 1, 9000.00),
(4, 2, 15, 1, 1500.00),
(5, 2, 16, 1, 12000.00),
(6, 3, 12, 1, 8900.00),
(7, 3, 13, 1, 9000.00),
(8, 3, 15, 1, 1500.00),
(9, 4, 12, 1, 8900.00),
(10, 4, 13, 1, 9000.00),
(11, 4, 15, 1, 1500.00),
(12, 5, 13, 1, 9000.00),
(13, 5, 15, 1, 1500.00),
(14, 6, 10, 1, 8700.00),
(15, 6, 13, 1, 9000.00),
(16, 6, 15, 1, 1500.00),
(17, 7, 19, 1, 45.00),
(18, 7, 18, 1, 4300.00),
(19, 8, 13, 1, 9000.00),
(20, 8, 15, 1, 1500.00),
(21, 9, 17, 1, 301.00),
(22, 9, 16, 1, 12000.00),
(23, 9, 15, 1, 1500.00),
(24, 9, 13, 1, 9000.00),
(25, 10, 10, 1, 8700.00),
(26, 10, 12, 1, 8900.00),
(27, 11, 12, 1, 8900.00),
(28, 11, 13, 1, 9000.00),
(29, 12, 12, 1, 8900.00),
(30, 12, 13, 1, 9000.00),
(31, 13, 19, 1, 45.00),
(32, 13, 18, 1, 4300.00),
(33, 14, 13, 1, 9000.00),
(34, 15, 15, 1, 1500.00),
(35, 16, 16, 1, 12000.00),
(36, 17, 12, 6, 8900.00),
(37, 18, 21, 3, 45.00),
(38, 18, 10, 1, 8700.00),
(39, 18, 15, 1, 1500.00),
(40, 19, 10, 1, 8700.00),
(41, 19, 15, 1, 1500.00),
(42, 20, 18, 1, 4300.00),
(43, 21, 17, 1, 301.00),
(44, 22, 17, 1, 301.00),
(45, 22, 24, 1, 12.00),
(46, 23, 24, 1, 12.00),
(47, 23, 21, 1, 45.00),
(48, 24, 23, 3, 245.00),
(49, 24, 26, 3, 13.00);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `name`, `description`, `image`, `price`, `stock`, `supplier_id`, `category_id`, `is_active`) VALUES
(10, 'Series 1', 'For programers', '/uploads/1749355228301-laptops.jpeg', 8700.00, 11, 4, 3, 1),
(12, 'Series 2', 'Best', '/uploads/1749355634307-hp2.jpeg', 8900.00, 0, 1, 3, 1),
(13, 'Rastafari 7', 'Rasta', '/uploads/1749355858163-rasta7.jpg', 9000.00, 0, 1, 3, 1),
(15, 'Victus 8', 'Gaming', '/uploads/1749356611789-victus8.jpeg', 1500.00, 0, 5, 3, 1),
(16, 'Dracula MASS 13', 'Gaming Legend ', '/uploads/1749357071515-drac2.jpeg', 12000.00, 13, 1, 3, 1),
(17, 'Da Mouse 11', 'Gamin Mouse series 7 from ASUS', '/uploads/1749357270223-mouse2.jpeg', 301.00, 143, 1, 7, 0),
(18, 'Office Desktop PS1', 'For office  regular needs', '/uploads/1749357450181-desktops.jpeg', 4300.00, 163, 9, 4, 1),
(19, 'BT Link', 'bluetooth dungle', '/uploads/1756143925822-athletic-shorts.jpg', 66.00, 148, 7, 9, 0),
(20, 'BT Link Dungle', 'PC BT access ', '/uploads/1756185652776-white-dress-shirt.jpg', 13.10, 11, 6, 9, 1),
(21, 'BT Link Dungle 2', 'PC BT Access\r\n', NULL, 45.00, 10, 4, 6, 1),
(23, 'Mouse Gamin 1', 'Mouse Gamin1', NULL, 245.00, 14, 7, 7, 1),
(24, 'ddd', 'eee', NULL, 12.00, 10, 1, 7, 0),
(25, 'radio1', 'radio1', '/uploads/1754287022101-133635147280753395.jpg', 12.00, 12, 7, 11, 0),
(26, 'Digga', 'Dsecsfdgf', '/uploads/1756143272703-athletic-shorts.jpg', 13.00, 9, 1, 11, 1);

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `promotion_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('percentage','fixed','buy_x_get_y') NOT NULL,
  `value` varchar(50) NOT NULL,
  `min_quantity` int(11) DEFAULT 1,
  `max_quantity` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `applicable_products` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`applicable_products`)),
  `applicable_categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`applicable_categories`)),
  `code` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `promotions`
--

INSERT INTO `promotions` (`promotion_id`, `name`, `description`, `type`, `value`, `min_quantity`, `max_quantity`, `start_date`, `end_date`, `is_active`, `applicable_products`, `applicable_categories`, `code`, `created_at`, `updated_at`) VALUES
(1, 'Summer Sale 20% Off', 'Get 20% off on all electronics', 'percentage', '20', 1, NULL, '2024-05-31', '2026-01-30', 1, '[]', '[]', 'SUMMER20', '2025-06-21 06:57:38', '2025-06-21 07:43:12'),
(3, '$10 Off on Orders Over $50', 'Get $10 discount on orders over $50', 'fixed', '10', 1, NULL, '2024-06-01', '2024-12-31', 0, NULL, NULL, 'SAVE10', '2025-06-21 06:57:38', '2025-08-28 17:36:16'),
(4, 'Holiday Special 15% Off', '15% discount on all items', 'percentage', '15', 1, NULL, '2024-06-01', '2024-12-31', 0, NULL, NULL, 'HOLIDAY15', '2025-06-21 06:57:38', '2025-08-28 17:36:16'),
(5, 'SchoolEnd', '', 'fixed', '5', 1, NULL, '2025-06-21', '2025-10-21', 1, '[\"12\",\"13\",\"15\"]', '[\"3\"]', 'RIGA', '2025-06-21 07:47:48', '2025-06-22 09:35:50'),
(6, 'DDD', 'DDD', 'percentage', '20', 4, 15, '2025-09-06', '2025-09-13', 1, '[23,16,26]', '[]', 'DDD', '2025-09-05 22:02:06', '2025-09-05 22:03:46');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `storeName` varchar(255) NOT NULL DEFAULT 'My Store',
  `contactEmail` varchar(255) NOT NULL DEFAULT 'contact@example.com',
  `contactPhone` varchar(50) NOT NULL DEFAULT '123-456-7890',
  `taxRate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `emailNotifications` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `currency` varchar(10) DEFAULT 'ILS'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `storeName`, `contactEmail`, `contactPhone`, `taxRate`, `emailNotifications`, `createdAt`, `updatedAt`, `currency`) VALUES
(1, 'TechStock2', '', '', 18.00, 1, '2025-06-07 04:48:02', '2025-09-06 14:14:55', 'USD');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`supplier_id`, `name`, `email`, `phone`, `contact`, `address`, `isActive`) VALUES
(1, 'Demo Supplier 555', 'supp1@gmail.com', '0523746547', '3245', NULL, 1),
(4, 'Lenovo', NULL, NULL, '123', NULL, 1),
(5, 'HP', NULL, NULL, 'Great support!', NULL, 1),
(6, 'Jack', NULL, NULL, '123', NULL, 1),
(7, 'test1', NULL, NULL, 'sad.ffkjsldkjflkds', NULL, 1),
(9, 'PS1', 'ps1@sony.com', '6548765747', NULL, 'Tokyo', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `role` varchar(10) DEFAULT 'client',
  `profile_image` varchar(255) DEFAULT NULL,
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` bigint(20) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `password`, `name`, `phone`, `city`, `role`, `profile_image`, `resetPasswordToken`, `resetPasswordExpires`, `isActive`) VALUES
(1, 'yamen.rock@gmail.com', '$2b$10$c5r1dy49WjQD996UzN9AX.ApxB7287q3j3inuvuMX4GgRHqsvJNOq', 'Yamen Rock 22243', '0523746547', 'Nazareth Illit222', 'admin', '/uploads/image-1756184009196-477090655.jpg', '27b220be7845c20766fbb4473c72e04e04d2a48ac8c28a4b37e5d130f2a14c8b', 1757171279823, 1),
(3, 'bbbbb@gmail.com', '$2b$10$vAMeqmQ9u5jkoyZwRJaVGeM5v2U/M/7DQVrczxapLYFbcfzMCjnkK', 'Yamen Rock', '0523746547', 'Nazareth Illit', 'client', NULL, NULL, NULL, 1),
(4, 'admin', '$2a$10$Rk5rGwWcsZ6Uo.VKHBo0vOY.zTPQsHTn7O3wlWj/nCSrRAUDUq.yG', 'Admin User', '0501234567', 'Tel Aviv', 'admin', NULL, NULL, NULL, 1),
(5, 'admin@gmail.com', '$2b$10$1k9ge0Wisng4UtvIWjXTR.JKs.c4hMC4T7nG4PLzLQ66r3AsUgQYW', 'Admin User', '0523746547', 'Nazareth Illit', 'admin', '/uploads/1749530725110-rasta7.jpg', 'edcce7d2590e7a37f7f783b4ff23cafb77085abe97a5d8f64b83bf6d2e6205d9', 1757170912437, 1),
(6, 'newuser@gmail.com', '$2b$10$uTXeG0.n4hvXmTTEZzIZ0.NEQWaE/v6sgASNO1rEOod9EAoefJ80e', 'John The Mag', '123421344', 'Nazareth Illit', 'client', '/uploads/1749530335978-mouse2.jpeg', NULL, NULL, 1),
(7, 'squaregnd.dev@gmail.com', '$2b$10$OQp1Kxre8DIqZJMFqtB1N.5thKagtuaS01xv9F66dK1dyKVQsxZCW', 'Dev Grnd', '0523746547', 'Nazareth Illit', 'client', NULL, NULL, NULL, 1),
(8, 'info@gyhdubai.com', '$2b$10$CPXYIkY8V61F4fmk4byP0OXv9qgf0bpYDMetk5UjfrgT6TEhRc3qG', 'GYH Real Estate', '0586085967', 'Dubai', 'client', NULL, NULL, NULL, 1),
(9, 'yamen2@gmail.com', '$2b$10$xkqd455QYGIWZM4N09Hic.EBixf81JqqtKPFi1tk3OTHmXErRn.PW', 'Yamen Rock', '0523746547', 'Nazareth Illit', 'client', NULL, NULL, NULL, 1),
(11, 'yamen4@gmail.com', '$2b$10$FRHmhH8GyFJbMqrkRomdgeO2NsPPo3G7FkEsHHQhaHV8joUxOhE/.', 'יאמן רוק', '0523746547', 'נוף הגליל', 'client', '/uploads/image-1754285439554-195478851.jpg', NULL, NULL, 1),
(12, 'dev.ocean159@gmail.com', '$2b$10$/qzgCHWofd93tff2r8chAuMBZWN.SiOc1Ui8U2eTh2JnPi6qM69ry', 'Admin  Ocean', '0523746547', 'Nazareth Illit', 'client', '/uploads/image-1754286008921-705010066.jpg', NULL, NULL, 1),
(13, 'user3@gmail.com', '$2b$10$gwtqVUNTifRApfIBMmezn.71M6pc9Ii5OiALqjeyIqf4Z7AjvFb5C', 'User Three', '0523746547', 'Nazareth Illit', 'client', '/uploads/image-1756140961296-929729757.jpg', NULL, NULL, 1),
(15, 'yamen5@gmail.com', '$2b$10$qRCoJnKYZXmtfMEx3SdkcuKHfipSrBUwhaH.VbHFzTSWCBMm1idKm', 'Yamen Rock', '0523746547', 'Nazareth Illit', 'client', NULL, NULL, NULL, 1),
(16, 'user4@gmail.com', '$2b$10$/oHfHn62iHgl7Y4Lf2c6fuT8Xms4n1aqXlGxjN2hn3ZwSkd.dJKay', 'User3 User3 4', '34534646456', 'NAz', 'user', 'https://via.placeholder.com/150', NULL, NULL, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_products_active` (`is_active`);

--
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`promotion_id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_active_date` (`is_active`,`start_date`,`end_date`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_type` (`type`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `promotion_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`),
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
