-- Copyright (c) 2019, UW Medicine Research IT, University of Washington
-- Developed by Nic Dobbins and Cliff Spital, CRIO Sean Mooney
-- This Source Code Form is subject to the terms of the Mozilla Public
-- License, v. 2.0. If a copy of the MPL was not distributed with this
-- file, You can obtain one at http://mozilla.org/MPL/2.0/.
﻿USE [master]
GO
/****** Object:  Database [LeafDB]    Script Date: 4/8/19 1:11:21 PM ******/
CREATE DATABASE [LeafDB]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'LeafDB', FILENAME = N'/var/opt/mssql/data/LeafDB.mdf' , SIZE = 335872KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'LeafDB_log', FILENAME = N'/var/opt/mssql/data/LeafDB_log.ldf' , SIZE = 860160KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
GO
ALTER DATABASE [LeafDB] SET COMPATIBILITY_LEVEL = 120
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [LeafDB].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [LeafDB] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [LeafDB] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [LeafDB] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [LeafDB] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [LeafDB] SET ARITHABORT OFF 
GO
ALTER DATABASE [LeafDB] SET AUTO_CLOSE ON 
GO
ALTER DATABASE [LeafDB] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [LeafDB] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [LeafDB] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [LeafDB] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [LeafDB] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [LeafDB] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [LeafDB] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [LeafDB] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [LeafDB] SET  ENABLE_BROKER 
GO
ALTER DATABASE [LeafDB] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [LeafDB] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [LeafDB] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [LeafDB] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [LeafDB] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [LeafDB] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [LeafDB] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [LeafDB] SET RECOVERY SIMPLE 
GO
ALTER DATABASE [LeafDB] SET  MULTI_USER 
GO
ALTER DATABASE [LeafDB] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [LeafDB] SET DB_CHAINING OFF 
GO
ALTER DATABASE [LeafDB] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [LeafDB] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [LeafDB] SET DELAYED_DURABILITY = DISABLED 
GO
EXEC sys.sp_db_vardecimal_storage_format N'LeafDB', N'ON'
GO
ALTER DATABASE [LeafDB] SET  READ_WRITE 
GO
