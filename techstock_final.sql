-- MySQL dump 10.13  Distrib 8.4.5, for macos15.2 (arm64)
--
-- Host: localhost    Database: techstock
-- ------------------------------------------------------
-- Server version	8.4.5

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `isActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `unique_category_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (2,'Demo Category 24',NULL,NULL,0),(3,'Laptops',NULL,'Powerful laptops for work, gaming, and creativity',0),(4,'Desktops',NULL,NULL,1),(5,'Monitors',NULL,NULL,1),(6,'Keyboards',NULL,NULL,0),(7,'Mouses',NULL,NULL,1),(8,'Smartphones',NULL,NULL,1),(9,'Aux2435','/uploads/1760176871100-Screenshot 2025-10-11 at 10.28.55.png',NULL,1),(11,'Radios12',NULL,NULL,1),(12,'Joax',NULL,NULL,0),(13,'Nested',NULL,NULL,0),(14,'cccd',NULL,NULL,0),(15,'VBN',NULL,NULL,1),(17,'cat6','/uploads/1759392470194-Screenshot 2025-10-02 at 10.57.31.png','gfgfgfg',0),(18,'VVV','/uploads/1759394359667-Screenshot 2025-10-02 at 11.21.24.png','DDDD',1),(19,'fgh','/uploads/1759837000101-Screenshot 2025-10-07 at 6.37.00.png','sdfsdf',1);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,12,1,8900.00),(2,1,20,1,12.00),(3,2,13,1,9000.00),(4,2,15,1,1500.00),(5,2,16,1,12000.00),(6,3,12,1,8900.00),(7,3,13,1,9000.00),(8,3,15,1,1500.00),(9,4,12,1,8900.00),(10,4,13,1,9000.00),(11,4,15,1,1500.00),(12,5,13,1,9000.00),(13,5,15,1,1500.00),(14,6,10,1,8700.00),(15,6,13,1,9000.00),(16,6,15,1,1500.00),(17,7,19,1,45.00),(18,7,18,1,4300.00),(19,8,13,1,9000.00),(20,8,15,1,1500.00),(21,9,17,1,301.00),(22,9,16,1,12000.00),(23,9,15,1,1500.00),(24,9,13,1,9000.00),(25,10,10,1,8700.00),(26,10,12,1,8900.00),(27,11,12,1,8900.00),(28,11,13,1,9000.00),(29,12,12,1,8900.00),(30,12,13,1,9000.00),(31,13,19,1,45.00),(32,13,18,1,4300.00),(33,14,13,1,9000.00),(34,15,15,1,1500.00),(35,16,16,1,12000.00),(36,17,12,6,8900.00),(37,18,21,3,45.00),(38,18,10,1,8700.00),(39,18,15,1,1500.00),(40,19,10,1,8700.00),(41,19,15,1,1500.00),(42,20,18,1,4300.00),(43,21,17,1,301.00),(44,22,17,1,301.00),(45,22,24,1,12.00),(46,23,24,1,12.00),(47,23,21,1,45.00),(48,24,23,3,245.00),(49,24,26,3,13.00),(50,25,20,7,13.10),(51,26,20,4,13.10),(52,26,21,1,45.00),(53,27,21,6,45.00),(54,27,26,1,13.00),(55,28,21,3,45.00),(56,29,27,1,12.00),(57,30,27,1,12.00),(58,31,27,1,12.00),(59,32,26,1,13.00),(60,32,16,1,12000.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `shipping_address` text COLLATE utf8mb4_general_ci,
  `payment_method` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `promotion_id` int DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `order_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,5,8912.00,NULL,NULL,NULL,'confirmed','2025-06-22 06:01:47'),(2,1,22500.00,NULL,NULL,NULL,'Processing','2025-06-22 07:41:03'),(3,1,19400.00,'Nazareth','credit_card',NULL,'Shipped','2025-06-22 09:14:29'),(4,1,19400.00,'sfcsdfsdf','paypal',NULL,'pending','2025-06-22 09:17:01'),(5,1,10500.00,'etyerytrety','credit_card',NULL,'pending','2025-06-22 09:21:25'),(6,1,19200.00,'Nazareth','credit_card',NULL,'pending','2025-06-22 09:24:17'),(7,1,4345.00,'Nazareth','credit_card',NULL,'pending','2025-06-22 09:28:06'),(8,6,10500.00,'Nazareth','credit_card',NULL,'pending','2025-06-22 09:33:07'),(9,6,22801.00,'Nazareth','credit_card',NULL,'pending','2025-06-22 09:37:16'),(10,1,14080.00,'Nazareth','credit_card',1,'pending','2025-06-22 09:48:35'),(11,1,17900.00,'sfcsdfsdf','credit_card',NULL,'Delivered','2025-06-23 09:39:40'),(12,9,17900.00,'Nazareth','credit_card',NULL,'Shipped','2025-08-03 14:54:27'),(13,1,4345.00,'Nazareth','credit_card',NULL,'Processing','2025-08-03 15:43:49'),(14,1,9000.00,'Nazareth','credit_card',NULL,'pending','2025-08-03 15:49:12'),(15,1,1500.00,'Nazareth','credit_card',NULL,'pending','2025-08-03 15:52:39'),(16,1,12000.00,'Nazareth','credit_card',NULL,'Processing','2025-08-03 15:57:07'),(17,1,53395.00,'Haifa','credit_card',5,'pending','2025-08-04 04:32:31'),(18,1,10330.00,'Nazareth','credit_card',5,'pending','2025-08-04 05:15:04'),(19,11,10195.00,'Nazareth','credit_card',5,'pending','2025-08-04 05:31:23'),(20,12,4300.00,'Nazareth','credit_card',NULL,'Processing','2025-08-04 05:40:33'),(21,1,301.00,'Nazareth','credit_card',NULL,'pending','2025-08-04 06:21:06'),(22,1,313.00,'Nazareth','credit_card',NULL,'Shipped','2025-08-04 06:24:55'),(23,1,57.00,'Nazareth','credit_card',NULL,'Processing','2025-08-26 05:55:34'),(24,1,619.20,'Nof Hagaill','credit_card',6,'Delivered','2025-09-05 22:41:27'),(25,1,91.70,'Nof Hagaill','credit_card',NULL,'Processing','2025-09-28 05:45:48'),(26,1,97.40,'Nof Hagaill','credit_card',NULL,'pending','2025-09-28 08:37:48'),(27,1,283.00,'Nof Hagaill','credit_card',NULL,'pending','2025-09-28 11:27:40'),(28,1,135.00,'Nof Hagaill','credit_card',NULL,'Shipped','2025-09-28 11:34:40'),(29,40,12.00,'Test Address','paypal',NULL,'confirmed','2025-10-11 14:47:37'),(30,40,12.00,'Test Address','paypal',NULL,'Delivered','2025-10-11 14:47:57'),(31,1,12.00,'jhkhjk','credit_card',NULL,'Shipped','2025-10-11 14:48:43'),(32,1,14175.34,'Nof Hagaill','credit_card',NULL,'confirmed','2025-10-26 06:24:39');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `stock` int DEFAULT NULL,
  `supplier_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`product_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `category_id` (`category_id`),
  KEY `idx_products_active` (`is_active`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (10,'Series 1','For programers','/uploads/1749355228301-laptops.jpeg',8700.00,0,4,3,1),(12,'Series 2','Best','/uploads/1749355634307-hp2.jpeg',8900.00,0,1,3,1),(13,'Rastafari 7','Rasta','/uploads/1749355858163-rasta7.jpg',9000.00,0,1,3,1),(15,'Victus 8','Gaming','/uploads/1749356611789-victus8.jpeg',1500.00,0,5,3,1),(16,'Dracula MASS 13','Gaming Legend ','/uploads/1749357071515-drac2.jpeg',12000.00,12,1,3,1),(17,'Da Mouse 11','Gamin Mouse series 7 from ASUS','/uploads/1749357270223-mouse2.jpeg',301.00,143,1,14,0),(18,'Office Desktop PS1','For office  regular needs','/uploads/1749357450181-desktops.jpeg',4300.00,163,9,4,1),(19,'BT Link','bluetooth dungle','/uploads/1756143925822-athletic-shorts.jpg',66.00,148,7,9,0),(20,'BT Link Dungle','PC BT access ','/uploads/1756185652776-white-dress-shirt.jpg',13.10,0,6,9,1),(21,'BT Link Dungle 2','PC BT Access\r\n',NULL,45.00,0,4,6,1),(23,'Mouse Gamin 1','Mouse Gamin1','/uploads/1759039624529-Screenshot 2025-09-27 at 7.30.42.png',230.00,14,7,7,1),(24,'ddd','eee',NULL,12.00,10,1,7,0),(25,'radio1','radio1','/uploads/1754287022101-133635147280753395.jpg',12.00,12,7,11,0),(26,'Digga','Dsecsfdgf','/uploads/1756143272703-athletic-shorts.jpg',13.00,7,1,11,1),(27,'Ababa345','Yababa','/uploads/1759813232376-Screenshot 2025-10-07 at 6.37.00.png',12.00,2,5,2,0);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `promotion_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `type` enum('percentage','fixed') COLLATE utf8mb4_general_ci NOT NULL,
  `value` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `min_quantity` int DEFAULT '1',
  `max_quantity` int DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `applicable_products` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `applicable_categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`promotion_id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_active_date` (`is_active`,`start_date`,`end_date`),
  KEY `idx_code` (`code`),
  KEY `idx_type` (`type`),
  CONSTRAINT `promotions_chk_1` CHECK (json_valid(`applicable_products`)),
  CONSTRAINT `promotions_chk_2` CHECK (json_valid(`applicable_categories`))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
INSERT INTO `promotions` VALUES (1,'Summer Sale 20% Off','Get 20% off on all electronics','percentage','20',2,NULL,'2025-10-26','2026-01-30',1,'[]','[]','SUMMER20','2025-06-21 06:57:38','2025-10-26 05:55:08'),(3,'$10 Off on Orders Over $50','Get $10 discount on orders over $50','fixed','10',1,NULL,'2024-06-01','2024-12-31',0,NULL,NULL,'SAVE10','2025-06-21 06:57:38','2025-08-28 17:36:16'),(4,'Holiday Special 15% Off','15% discount on all items','percentage','15',1,NULL,'2024-06-01','2024-12-31',0,NULL,NULL,'HOLIDAY15','2025-06-21 06:57:38','2025-08-28 17:36:16'),(6,'DDD','DDD','percentage','20',4,15,'2025-09-06','2025-09-13',0,'[23,16,26]','[]','DDD','2025-09-05 22:02:06','2025-09-27 04:34:39');
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeName` varchar(255) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'My Store',
  `contactEmail` varchar(255) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'contact@example.com',
  `contactPhone` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '123-456-7890',
  `taxRate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `emailNotifications` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `currency` varchar(10) COLLATE utf8mb4_general_ci DEFAULT 'ILS',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'TechStock2','','',18.00,1,'2025-06-07 04:48:02','2025-10-15 06:56:11','EUR');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `contact` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `isActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`supplier_id`),
  UNIQUE KEY `unique_supplier_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Demo Supplier 55545','supp1@gmail.com','0523746547','3245',NULL,0),(4,'Lenovo',NULL,NULL,'123',NULL,0),(5,'HP',NULL,NULL,'Great support!',NULL,1),(6,'Jack',NULL,NULL,'123',NULL,1),(7,'test1',NULL,NULL,'sad.ffkjsldkjflkds',NULL,0),(9,'PS12','ps1@sony.com','6548765747',NULL,'Tokyo',0),(10,'Node','Node1@gmail.com','5465654154456',NULL,'Naz',0),(11,'New1','new1@gmail.com','652465495895846',NULL,'Naz',0),(13,'ddddd',NULL,NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` varchar(10) COLLATE utf8mb4_general_ci DEFAULT 'client',
  `profile_image` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `resetPasswordToken` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `resetPasswordExpires` bigint DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'yamen.rock@gmail.com','$2b$10$c5r1dy49WjQD996UzN9AX.ApxB7287q3j3inuvuMX4GgRHqsvJNOq','Yamen Rock','0523746547','Nazareth Illit22287','admin','/uploads/image-1760558351807-34675416.png','1e5e08788fc2a5f659b4d66602704d4f042aaa8337b539c49fa6826089419edc',1759407500298,1),(3,'bbbbb@gmail.com','$2b$10$vAMeqmQ9u5jkoyZwRJaVGeM5v2U/M/7DQVrczxapLYFbcfzMCjnkK','Yamen Rock','0523746547','Nazareth Illit','client',NULL,NULL,NULL,1),(4,'admin','$2a$10$Rk5rGwWcsZ6Uo.VKHBo0vOY.zTPQsHTn7O3wlWj/nCSrRAUDUq.yG','Admin User','0501234567','Tel Aviv','admin',NULL,NULL,NULL,1),(5,'admin@gmail.com','$2b$10$1k9ge0Wisng4UtvIWjXTR.JKs.c4hMC4T7nG4PLzLQ66r3AsUgQYW','Admin User','0523746547','Nazareth Illit','admin','/uploads/1749530725110-rasta7.jpg','edcce7d2590e7a37f7f783b4ff23cafb77085abe97a5d8f64b83bf6d2e6205d9',1757170912437,1),(6,'newuser@gmail.com','$2b$10$uTXeG0.n4hvXmTTEZzIZ0.NEQWaE/v6sgASNO1rEOod9EAoefJ80e','John The Mag','123421344','Nazareth Illit','client','/uploads/1749530335978-mouse2.jpeg',NULL,NULL,1),(7,'squaregnd.dev@gmail.com','$2b$10$OQp1Kxre8DIqZJMFqtB1N.5thKagtuaS01xv9F66dK1dyKVQsxZCW','Dev Grnd','0523746547','Nazareth Illit','client',NULL,NULL,NULL,0),(8,'info@gyhdubai.com','$2b$10$CPXYIkY8V61F4fmk4byP0OXv9qgf0bpYDMetk5UjfrgT6TEhRc3qG','GYH Real Estate','0586085967','Dubai','client',NULL,NULL,NULL,1),(9,'yamen2@gmail.com','$2b$10$xkqd455QYGIWZM4N09Hic.EBixf81JqqtKPFi1tk3OTHmXErRn.PW','Yamen Rock','0523746547','Nazareth Illit','client',NULL,NULL,NULL,1),(11,'yamen4@gmail.com','$2b$10$FRHmhH8GyFJbMqrkRomdgeO2NsPPo3G7FkEsHHQhaHV8joUxOhE/.','יאמן רוק','0523746547','נוף הגליל','client','/uploads/image-1754285439554-195478851.jpg',NULL,NULL,1),(12,'dev.ocean159@gmail.com','$2b$10$/qzgCHWofd93tff2r8chAuMBZWN.SiOc1Ui8U2eTh2JnPi6qM69ry','Admin  Ocean','0523746547','Nazareth Illit','client','/uploads/image-1754286008921-705010066.jpg',NULL,NULL,1),(13,'user3@gmail.com','$2b$10$gwtqVUNTifRApfIBMmezn.71M6pc9Ii5OiALqjeyIqf4Z7AjvFb5C','User Three','0523746547','Nazareth Illit','client','/uploads/image-1756140961296-929729757.jpg',NULL,NULL,1),(15,'yamen5@gmail.com','$2b$10$qRCoJnKYZXmtfMEx3SdkcuKHfipSrBUwhaH.VbHFzTSWCBMm1idKm','Yamen Rock','0523746547','Nazareth Illit','client',NULL,NULL,NULL,1),(16,'user4@gmail.com','$2b$10$/oHfHn62iHgl7Y4Lf2c6fuT8Xms4n1aqXlGxjN2hn3ZwSkd.dJKay','User3 User3 4','34534646456','NAz','user','https://via.placeholder.com/150',NULL,NULL,1),(17,'user1@gmail.com','$2b$10$G3xsR6j5/nMpKouVQxlDYOzTv3P0ozTNqKJu9J.0.VamDFQ804brC','User1 User1','0523746547','Nazareth Illit','user','/uploads/image-1759378722888-143423952.png',NULL,NULL,0),(18,'test1@example.com','hashed_password','Test Customer 1',NULL,NULL,'customer',NULL,NULL,NULL,0),(19,'test2@example.com','hashed_password','Test Customer 2',NULL,NULL,'customer',NULL,NULL,NULL,1),(20,'test3@example.com','hashed_password','Test Customer 3',NULL,NULL,'customer',NULL,NULL,NULL,1),(21,'test4@example.com','hashed_password','Test Customer 4',NULL,NULL,'customer',NULL,NULL,NULL,1),(22,'test5@example.com','hashed_password','Test Customer 5',NULL,NULL,'customer',NULL,NULL,NULL,1),(23,'test6@example.com','hashed_password','Test Customer 6',NULL,NULL,'customer',NULL,NULL,NULL,1),(24,'test7@example.com','hashed_password','Test Customer 7',NULL,NULL,'customer',NULL,NULL,NULL,1),(25,'test8@example.com','hashed_password','Test Customer 8',NULL,NULL,'customer',NULL,NULL,NULL,1),(26,'test9@example.com','hashed_password','Test Customer 9',NULL,NULL,'customer',NULL,NULL,NULL,1),(27,'test10@example.com','hashed_password','Test Customer 10',NULL,NULL,'customer',NULL,NULL,NULL,1),(28,'a@test.com','pass','Customer A',NULL,NULL,'customer',NULL,NULL,NULL,0),(29,'b@test.com','pass','Customer B',NULL,NULL,'customer',NULL,NULL,NULL,1),(30,'c@test.com','pass','Customer C',NULL,NULL,'customer',NULL,NULL,NULL,1),(31,'d@test.com','pass','Customer D',NULL,NULL,'customer',NULL,NULL,NULL,1),(32,'e@test.com','pass','Customer E',NULL,NULL,'customer',NULL,NULL,NULL,1),(33,'f@test.com','pass','Customer F',NULL,NULL,'customer',NULL,NULL,NULL,1),(34,'g@test.com','pass','Customer G',NULL,NULL,'customer',NULL,NULL,NULL,1),(35,'h@test.com','pass','Customer H',NULL,NULL,'customer',NULL,NULL,NULL,0),(36,'i@test.com','pass','Customer I',NULL,NULL,'customer',NULL,NULL,NULL,0),(37,'j@test.com','pass','Customer J',NULL,NULL,'customer',NULL,NULL,NULL,0),(38,'user345@gmaill.com','$2b$10$HgVWyhrXwgyqLgbrb58qfezJvQRu5sZQtDBY5u2lixENsimYC9c9C','user345 user345','0523746547','Nazareth','user',NULL,NULL,NULL,1),(39,'user445@gmail.com','$2b$10$YHwARpOB3olEtyN7EKd8FO1.vrlqmvvbRic2jJXZrelxii23N8T4y','user445 user445','0523746547','Nazareth Illit','user',NULL,NULL,NULL,1),(40,'test@example.com','$2b$10$GX8pHlE7xUDiXdof/nW2WObwC6vsz.sR1SCBrHgEsBv/KYrlVO/BG','Test User','1234567890','Test City','user',NULL,NULL,NULL,1),(41,'unique@example.com','$2b$10$C2HnYSHbj7ql03HVkhSMrekhxMQgl5ZWJh5j0u7YBqTxKkiIghTp2','Test User','12345678901','Test City','user',NULL,NULL,NULL,1),(42,'sequential@example.com','$2b$10$ed4j9vDKRx8kfTEf8uYy6uigjJKy5/9DQQuWcW6A6u.59sIUBynMu','Test User','1234567890','Test City','user',NULL,NULL,NULL,1),(43,'sequential2@example.com','$2b$10$ZziD7DzVypYTpNmBpQPHE.cy9iAahxsV3c.7bTQGyuw23h5I6/9SS','Test User','123456789012','Test City','user',NULL,NULL,NULL,1),(44,'sequential3@example.com','$2b$10$/f/J9ZBt6sRqNHbKJcUMjegS76eKI36EDtW4n116EAOKEQf1C1LKu','Test User','123456789012345','Test City','user',NULL,NULL,NULL,1),(45,'validphone@example.com','$2b$10$tvxRoRbSbQbuf9SdN3yig.qLu84clwN5yj/NCrZ7hpMdETqL3jeju','Test User','(555) 123-4567','Test City','user',NULL,NULL,NULL,1),(46,'international@example.com','$2b$10$H38gtelPgtCjTVrGBEIJJ.8OWqMjA3nl4S0bNdbL2cT1BLQaxhc16','Test User','+1 (555) 123-4567','Test City','user',NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-26  8:25:39
