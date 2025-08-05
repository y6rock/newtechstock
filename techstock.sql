-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3310
-- Generation Time: Jun 22, 2025 at 11:51 AM
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
  `name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `name`) VALUES
(2, 'Demo Category 2'),
(3, 'Laptops'),
(4, 'Desktops'),
(5, 'Monitors'),
(6, 'Keyboards'),
(7, 'Mouses'),
(8, 'Smartphones'),
(9, 'Aux');

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
(1, 5, 8912.00, NULL, NULL, NULL, 'pending', '2025-06-22 06:01:47'),
(2, 1, 22500.00, NULL, NULL, NULL, 'Processing', '2025-06-22 07:41:03'),
(3, 1, 19400.00, 'Nazareth', 'credit_card', NULL, 'Shipped', '2025-06-22 09:14:29'),
(4, 1, 19400.00, 'sfcsdfsdf', 'paypal', NULL, 'pending', '2025-06-22 09:17:01'),
(5, 1, 10500.00, 'etyerytrety', 'credit_card', NULL, 'pending', '2025-06-22 09:21:25'),
(6, 1, 19200.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-06-22 09:24:17'),
(7, 1, 4345.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-06-22 09:28:06'),
(8, 6, 10500.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-06-22 09:33:07'),
(9, 6, 22801.00, 'Nazareth', 'credit_card', NULL, 'pending', '2025-06-22 09:37:16'),
(10, 1, 14080.00, 'Nazareth', 'credit_card', 1, 'pending', '2025-06-22 09:48:35');

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
(26, 10, 12, 1, 8900.00);

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
  `category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `name`, `description`, `image`, `price`, `stock`, `supplier_id`, `category_id`) VALUES
(10, 'Series 1', 'For programers', '/uploads/1749355228301-laptops.jpeg', 8700.00, 13, 4, 3),
(12, 'Series 2', 'Best', '/uploads/1749355634307-hp2.jpeg', 8900.00, 8, 1, 3),
(13, 'Rastafari 7', 'Rasta', '/uploads/1749355858163-rasta7.jpg', 9000.00, -2, 1, 3),
(15, 'Victus 8', 'Gaming', '/uploads/1749356611789-victus8.jpeg', 1500.00, 3, 5, 3),
(16, 'Dracula MASS 13', 'Gaming Legend ', '/uploads/1749357071515-drac2.jpeg', 12000.00, 0, 1, 3),
(17, 'Da Mouse 11', 'Gamin Mouse series 7 from ASUS', '/uploads/1749357270223-mouse2.jpeg', 301.00, 145, 1, 7),
(18, 'Office Desktop PS1', 'For office  regular needs', '/uploads/1749357450181-desktops.jpeg', 4300.00, 165, 5, 4),
(19, 'BT Link', 'bluetooth dungle', '/uploads/1750445651183-tplink.jpg', 45.00, 149, 7, 9),
(20, 'BT Link Dungle', 'PC BT access', '/uploads/1750446062752-tplink.jpg', 12.00, 11, 6, 9),
(21, 'BT Link Dungle 2', 'PC BT Access\r\n', '/uploads/1750446194333-tplink.jpg', 45.00, 14, 4, 6),
(23, 'Mouse Gamin 1', 'Mouse Gamin1', '/uploads/1750447459660-mousec.jpg', 245.00, 17, 7, 7),
(24, 'ddd', 'eee', '/uploads/1750579059747-lotoo1.jpg', 12.00, 12, 1, 7);

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
(3, '$10 Off on Orders Over $50', 'Get $10 discount on orders over $50', 'fixed', '10', 1, NULL, '2024-06-01', '2024-12-31', 1, NULL, NULL, 'SAVE10', '2025-06-21 06:57:38', '2025-06-21 06:57:38'),
(4, 'Holiday Special 15% Off', '15% discount on all items', 'percentage', '15', 1, NULL, '2024-06-01', '2024-12-31', 1, NULL, NULL, 'HOLIDAY15', '2025-06-21 06:57:38', '2025-06-21 07:39:46'),
(5, 'SchoolEnd', '', 'fixed', '5', 1, NULL, '2025-06-21', '2025-10-21', 1, '[\"12\",\"13\",\"15\"]', '[\"3\"]', 'RIGA', '2025-06-21 07:47:48', '2025-06-22 09:35:50');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `storeName` varchar(255) NOT NULL DEFAULT 'My Store',
  `contactEmail` varchar(255) NOT NULL DEFAULT 'contact@example.com',
  `contactPhone` varchar(50) NOT NULL DEFAULT '123-456-7890',
  `taxRate` decimal(5,2) NOT NULL DEFAULT 18.00,
  `emailNotifications` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `currency` varchar(10) DEFAULT 'ILS'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `storeName`, `contactEmail`, `contactPhone`, `taxRate`, `emailNotifications`, `createdAt`, `updatedAt`, `currency`) VALUES
(1, 'TechStock', '', '', 18.00, 1, '2025-06-07 04:48:02', '2025-06-22 09:39:08', 'ILS');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`supplier_id`, `name`, `email`, `phone`, `contact`) VALUES
(1, 'Demo Supplier 555', 'supp1@gmail.com', '0523746547', 'zxfasdfsdghghfr'),
(4, 'Lenovo', NULL, NULL, '123'),
(5, 'HP', NULL, NULL, 'Great support!'),
(6, 'Jack', NULL, NULL, '123'),
(7, 'test1', NULL, NULL, 'sad.ffkjsldkjflkds');

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
  `resetPasswordExpires` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `password`, `name`, `phone`, `city`, `role`, `profile_image`, `resetPasswordToken`, `resetPasswordExpires`) VALUES
(1, 'yamen.rock@gmail.com', '$2b$10$1k9ge0Wisng4UtvIWjXTR.JKs.c4hMC4T7nG4PLzLQ66r3AsUgQYW', 'Yamen Rock', '0523746547', 'Nazareth Illit', 'admin', NULL, 'e7c60e811f1abfe694310870c33f39db3e154a17', 1750499682841),
(3, 'bbbbb@gmail.com', '$2b$10$vAMeqmQ9u5jkoyZwRJaVGeM5v2U/M/7DQVrczxapLYFbcfzMCjnkK', 'Yamen Rock', '0523746547', 'Nazareth Illit', 'client', NULL, NULL, NULL),
(4, 'admin', '$2a$10$Rk5rGwWcsZ6Uo.VKHBo0vOY.zTPQsHTn7O3wlWj/nCSrRAUDUq.yG', 'Admin User', '0501234567', 'Tel Aviv', 'admin', NULL, NULL, NULL),
(5, 'admin@gmail.com', '$2b$10$1k9ge0Wisng4UtvIWjXTR.JKs.c4hMC4T7nG4PLzLQ66r3AsUgQYW', 'Admin User', '0523746547', 'Nazareth Illit', 'admin', '/uploads/1749530725110-rasta7.jpg', NULL, NULL),
(6, 'newuser@gmail.com', '$2b$10$uTXeG0.n4hvXmTTEZzIZ0.NEQWaE/v6sgASNO1rEOod9EAoefJ80e', 'John The Mag', '123421344', 'Nazareth Illit', 'client', '/uploads/1749530335978-mouse2.jpeg', NULL, NULL),
(7, 'squaregnd.dev@gmail.com', '$2b$10$OQp1Kxre8DIqZJMFqtB1N.5thKagtuaS01xv9F66dK1dyKVQsxZCW', 'Dev Grnd', '0523746547', 'Nazareth Illit', 'client', NULL, NULL, NULL),
(8, 'info@gyhdubai.com', '$2b$10$CPXYIkY8V61F4fmk4byP0OXv9qgf0bpYDMetk5UjfrgT6TEhRc3qG', 'GYH Real Estate', '0586085967', 'Dubai', 'client', NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

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
  ADD KEY `category_id` (`category_id`);

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
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `promotion_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
