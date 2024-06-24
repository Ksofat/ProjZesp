-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 02, 2024 at 12:40 PM
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
-- Database: `isekai`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `AddressID` int(11) NOT NULL,
  `Street` varchar(70) NOT NULL,
  `BuildingNumber` varchar(4) NOT NULL,
  `ApartmentNumber` varchar(4) DEFAULT NULL,
  `City` varchar(70) NOT NULL,
  `PostalCode` varchar(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addresses`
--

INSERT INTO `addresses` (`AddressID`, `Street`, `BuildingNumber`, `ApartmentNumber`, `City`, `PostalCode`) VALUES
(1, 'Main Street', '123', '1', 'Kebabville', '00001'),
(2, 'Second Street', '456', NULL, 'Kebabtown', '00002');

-- --------------------------------------------------------

--
-- Table structure for table `extras`
--

CREATE TABLE `extras` (
  `ExtrasID` int(11) NOT NULL,
  `Name` varchar(20) NOT NULL,
  `ExtrasPrice` decimal(5,2) NOT NULL,
  `ExtrasCategory` char(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `extras`
--

INSERT INTO `extras` (`ExtrasID`, `Name`, `ExtrasPrice`, `ExtrasCategory`) VALUES
(1, 'Spicy-Hot Sauce', 0.99, 'Sauce'),
(2, 'Extra Cheese', 0.79, 'Cheese'),
(3, 'Garlic Sauce', 0.49, 'Sauce');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `InventoryID` int(11) NOT NULL,
  `ItemName` varchar(54) NOT NULL,
  `ItemQuantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`InventoryID`, `ItemName`, `ItemQuantity`) VALUES
(1, 'Chicken', 50),
(2, 'Mortadella', 30),
(3, 'Lettuce', 20);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `OrderID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `OrderDate` datetime NOT NULL,
  `Quantity` int(11) NOT NULL,
  `WholePrice` decimal(5,2) NOT NULL,
  `OrderStatus` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`OrderID`, `UserID`, `OrderDate`, `Quantity`, `WholePrice`, `OrderStatus`) VALUES
(1, 1, '2024-04-01 18:30:00', 1, 7.98, 'Completed'),
(2, 2, '2024-04-02 12:15:00', 2, 15.96, 'Preparing');

-- --------------------------------------------------------

--
-- Table structure for table `product&extrastoorder`
--

CREATE TABLE `product&extrastoorder` (
  `OrderID` int(11) NOT NULL,
  `ProductID` int(11) NOT NULL,
  `ExtrasID` int(11) DEFAULT NULL,
  `ReciptPrice` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product&extrastoorder`
--

INSERT INTO `product&extrastoorder` (`OrderID`, `ProductID`, `ExtrasID`, `ReciptPrice`) VALUES
(1, 2, 1, 7.98),
(2, 1, 3, 6.48);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `ProductID` int(11) NOT NULL,
  `Name` varchar(20) NOT NULL,
  `Description` char(80) DEFAULT NULL,
  `ProductPrice` decimal(5,2) NOT NULL,
  `ProductCategory` varchar(20) NOT NULL,
  `Image` blob DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`ProductID`, `Name`, `Description`, `ProductPrice`, `ProductCategory`, `Image`) VALUES
(1, 'Classic Kebab', 'A classic kebab with chicken, salad, and sauce', 5.99, 'Kebab', NULL),
(2, 'Mortadella Kebab', 'Kebab with mortadella, lettuce, tomato, and mayo', 6.99, 'Specialty Kebab', NULL),
(3, 'Veggie Kebab', 'A kebab with a variety of vegetables and sauce', 5.49, 'Vegetarian', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `FirstName` varchar(20) NOT NULL,
  `LastName` varchar(20) NOT NULL,
  `E-mail` varchar(30) NOT NULL,
  `Password` varchar(80) NOT NULL,
  `PhoneNumber` varchar(11) NOT NULL,
  `Type` varchar(1) DEFAULT NULL,
  `AdressID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `FirstName`, `LastName`, `E-mail`, `Password`, `PhoneNumber`, `Type`, `AdressID`) VALUES
(1, 'Kamil', 'Górny', 'k3k@pola.ris', 'hashed_password', '1234567890', 'M', NULL),
(2, 'Jane', 'Smith', 'jane.smith@example.com', 'hashed_password', '0987654321', NULL, 2),
(3, 'Bob', 'Brown', 'bob.brown@example.com', 'hashed_password', '111223344', 'W', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`AddressID`),
  ADD UNIQUE KEY `AdressID` (`AddressID`);

--
-- Indexes for table `extras`
--
ALTER TABLE `extras`
  ADD PRIMARY KEY (`ExtrasID`),
  ADD UNIQUE KEY `ExtrasID` (`ExtrasID`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`InventoryID`),
  ADD UNIQUE KEY `ProductID` (`InventoryID`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`OrderID`),
  ADD UNIQUE KEY `UserID` (`UserID`);

--
-- Indexes for table `product&extrastoorder`
--
ALTER TABLE `product&extrastoorder`
  ADD PRIMARY KEY (`OrderID`,`ProductID`),
  ADD KEY `IX_ExtrasToOrder` (`ExtrasID`),
  ADD KEY `ProductsToOrder` (`ProductID`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`ProductID`),
  ADD UNIQUE KEY `ProductID` (`ProductID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `UserID` (`UserID`),
  ADD UNIQUE KEY `email` (`E-mail`),
  ADD KEY `AdressToUsers` (`AdressID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `AddressID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `extras`
--
ALTER TABLE `extras`
  MODIFY `ExtrasID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `InventoryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `OrderID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `ProductID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `UsersToOrders` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`);

--
-- Constraints for table `product&extrastoorder`
--
ALTER TABLE `product&extrastoorder`
  ADD CONSTRAINT `ExtrasToOrder` FOREIGN KEY (`ExtrasID`) REFERENCES `extras` (`ExtrasID`),
  ADD CONSTRAINT `Products&ExtrasToOrder` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`),
  ADD CONSTRAINT `ProductsToOrder` FOREIGN KEY (`ProductID`) REFERENCES `products` (`ProductID`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `AdressToUsers` FOREIGN KEY (`AdressID`) REFERENCES `addresses` (`AddressID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
