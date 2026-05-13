SET SQL_SAFE_UPDATES = 0;

DROP DATABASE IF EXISTS departments; 
CREATE DATABASE departments;
use departments;

DROP TABLE IF EXISTS role;
CREATE TABLE role (
	Code_role INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(20) UNIQUE NOT NULL
);

DROP TABLE IF EXISTS department;
CREATE TABLE department (
    Code_dept INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(20) UNIQUE NOT NULL
);

DROP TABLE IF EXISTS user;
CREATE TABLE user (
    Id_user INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(256) NOT NULL,
    Code_dept INT UNSIGNED,
    FOREIGN KEY (Code_dept) REFERENCES department(Code_dept) ON DELETE CASCADE,
    Code_role INT UNSIGNED,
    FOREIGN KEY (Code_role) REFERENCES role(Code_role) ON DELETE CASCADE
);

DROP TABLE IF EXISTS budget;
CREATE TABLE budget (
	Id_budget INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	Total_amount DECIMAL (10,2) UNSIGNED NOT NULL,
	Year YEAR NOT NULL,
	Type TINYINT UNSIGNED NOT NULL,
	CHECK (Type IN (1,2)),
	Code_dept INT UNSIGNED,
	FOREIGN KEY (Code_dept) REFERENCES department(Code_dept) ON DELETE RESTRICT
);

DROP TABLE IF EXISTS supplier;
CREATE TABLE supplier (
	Id_supplier INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	Name VARCHAR (100) NOT NULL,
	CIF VARCHAR (20) NOT NULL UNIQUE, 
	Address VARCHAR (200) NOT NULL,
	Phone VARCHAR (20) NOT NULL,
	Mail VARCHAR (100) NOT NULL UNIQUE
);

DROP TABLE IF EXISTS purchase_order;
CREATE TABLE purchase_order (
	Code_order INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	Date TIMESTAMP NOT NULL DEFAULT NOW(),
	Amount DECIMAL (10,2) NOT NULL,
	Id_budget INT UNSIGNED,
	Id_supplier INT UNSIGNED,
	FOREIGN KEY (Id_budget) REFERENCES budget(Id_budget) ON DELETE RESTRICT,
	FOREIGN KEY (Id_supplier) REFERENCES supplier(Id_supplier) ON DELETE RESTRICT
);

DROP TABLE IF EXISTS invoice;
CREATE TABLE invoice (
	Code_invoice INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	Date TIMESTAMP NOT NULL DEFAULT NOW(),
	Total_amount DECIMAL (10,2) NOT NULL,
	PDF_file BLOB,
    Code_order INT UNSIGNED,
    FOREIGN KEY (Code_order) REFERENCES purchase_order(Code_order) ON DELETE RESTRICT
);

DROP TABLE IF EXISTS Dept_Supplier;
CREATE TABLE Dept_Supplier(
	Code_dept INT UNSIGNED,
    Id_supplier INT UNSIGNED,
    PRIMARY KEY (Code_dept, Id_supplier),
    FOREIGN KEY (Code_dept) REFERENCES department (Code_dept) ON DELETE CASCADE,
    FOREIGN KEY (Id_supplier) REFERENCES supplier (Id_supplier) ON DELETE CASCADE
);


-- Hago algunos inserts:
INSERT INTO department (Name)
VALUES
('Informatica'),
('Mecanica'),
('Electricidad'),
('Automocion'),
('Grado Basico'),
('Telecomunicaciones'),
('Robotica'),
('Primaria'),
('Infantil'),
('Secundaria'),
('Bachillerato'),
('SAT'),
('Mantenimiento'),
('Premio Don Bosco'),
('Formacion'),
('Administracion');

INSERT INTO role (Name)
VALUES
('admin'),
('accountant'),
('dept_manager');

INSERT INTO user (Name, Email, Password, Code_dept, Code_role)
VALUES
('Alicia García', 'alicia@salesianos.com', 'pass123', NULL, 1),
('Miguel Pérez', 'miguel@salesianos.com', 'pass123', 15, 2),
('Carlos Sanz', 'carlos@salesianos.com', 'pass123', 1, 3),
('Laura Bielsa', 'laura@salesianos.com', 'pass123', 2, 3);

INSERT INTO supplier (Name, CIF, Address, Phone, Mail)
VALUES
('Proveedor A', 'A12345678', 'Calle Mayor 1', '600111222', 'a@supplier.com'),
('Proveedor B', 'B87654321', 'Calle Sol 2', '600333444', 'b@supplier.com');

INSERT INTO Dept_Supplier (Code_dept, Id_supplier)
VALUES
(1, 1),
(2, 1),
(1, 2);

-- Inserts de presupuestos 
-- Type 1: Presupuesto normal Type 2: Plan de inversión
INSERT INTO budget (Total_amount, Year, Type, Code_dept)
VALUES
-- Informatica
(5000.00, 2026, 1, 1),
(12000.00, 2026, 2, 1),
-- Mecanica
(4500.00, 2026, 1, 2),
(15000.00, 2026, 2, 2),
-- Electricidad
(3000.00, 2026, 1, 3),
-- Automocion
(4000.00, 2026, 1, 4),
(10000.00, 2026, 2, 4),
-- Grado Basico
(2000.00, 2026, 1, 5),
-- Telecomunicaciones
(3500.00, 2026, 1, 6),
-- Robotica
(3000.00, 2026, 1, 7),
(20000.00, 2026, 2, 7),
-- Primaria
(1500.00, 2026, 1, 8),
-- Infantil
(1200.00, 2026, 1, 9),
-- Secundaria
(2500.00, 2026, 1, 10),
-- Bachillerato
(2000.00, 2026, 1, 11),
-- SAT
(1000.00, 2026, 1, 12),
-- Mantenimiento
(6000.00, 2026, 1, 13),
-- Premio Don Bosco
(8000.00, 2026, 2, 14),
-- Formacion
(2500.00, 2026, 1, 15),
-- Administracion
(2000.00, 2026, 1, 16);

DROP ROLE IF EXISTS 'role_admin'; -- roles and users have been created just to simulate how it colud be done
DROP ROLE IF EXISTS 'role_contable';
DROP ROLE IF EXISTS 'role_jefe';
CREATE ROLE 'role_admin';
CREATE ROLE 'role_contable';
CREATE ROLE 'role_jefe';

GRANT SELECT, INSERT, UPDATE, DELETE ON departments.* TO 'role_admin';
GRANT SELECT ON departments.* TO 'role_contable';
GRANT SELECT ON departments.supplier TO 'role_jefe';
GRANT SELECT ON departments.budget TO 'role_jefe';
GRANT SELECT, INSERT ON departments.purchase_order TO 'role_jefe';
GRANT SELECT, INSERT ON departments.invoice TO 'role_jefe';
GRANT SELECT ON departments.department TO 'role_jefe';

DROP USER IF EXISTS 'admin'@'localhost', 'contable'@'localhost', 'jefe_info'@'localhost', 'jefe_meca'@'localhost', 'jefe_elta'@'localhost',
'jefe_auto'@'localhost', 'jefe_fpgb'@'localhost', 'jefe_tele'@'localhost', 'jefe_robo'@'localhost', 'jefe_pri'@'localhost', 'jefe_inf'@'localhost',
'jefe_eso'@'localhost', 'jefe_bac'@'localhost', 'jefe_sat'@'localhost', 'jefe_mant'@'localhost', 'jefe_pdb'@'localhost', 'jefe_for'@'localhost',
'jefe_adm'@'localhost';

CREATE USER 'admin'@'localhost' IDENTIFIED BY 'admin123';
CREATE USER 'contable'@'localhost' IDENTIFIED BY 'cont123';
CREATE USER 'jefe_info'@'localhost' IDENTIFIED BY 'info123';
CREATE USER 'jefe_meca'@'localhost' IDENTIFIED BY 'meca123';
CREATE USER 'jefe_elta'@'localhost' IDENTIFIED BY 'elta123';
CREATE USER 'jefe_auto'@'localhost' IDENTIFIED BY 'auto123';
CREATE USER 'jefe_fpgb'@'localhost' IDENTIFIED BY 'fpgb123';
CREATE USER 'jefe_tele'@'localhost' IDENTIFIED BY 'tele123';
CREATE USER 'jefe_robo'@'localhost' IDENTIFIED BY 'robo123';
CREATE USER 'jefe_pri'@'localhost' IDENTIFIED BY 'pri123';
CREATE USER 'jefe_inf'@'localhost' IDENTIFIED BY 'inf123';
CREATE USER 'jefe_eso'@'localhost' IDENTIFIED BY 'eso123';
CREATE USER 'jefe_bac'@'localhost' IDENTIFIED BY 'bac123';
CREATE USER 'jefe_sat'@'localhost' IDENTIFIED BY 'sat123';
CREATE USER 'jefe_mant'@'localhost' IDENTIFIED BY 'mant123';
CREATE USER 'jefe_pdb'@'localhost' IDENTIFIED BY 'pdb123';
CREATE USER 'jefe_for'@'localhost' IDENTIFIED BY 'for123';
CREATE USER 'jefe_adm'@'localhost' IDENTIFIED BY 'adm123';

GRANT 'role_admin' TO 'admin'@'localhost';
GRANT 'role_contable' TO 'contable'@'localhost';
GRANT 'role_jefe' TO 
'jefe_info'@'localhost',
'jefe_meca'@'localhost',
'jefe_elta'@'localhost',
'jefe_auto'@'localhost',
'jefe_fpgb'@'localhost',
'jefe_tele'@'localhost',
'jefe_robo'@'localhost',
'jefe_pri'@'localhost',
'jefe_inf'@'localhost',
'jefe_eso'@'localhost',
'jefe_bac'@'localhost',
'jefe_sat'@'localhost',
'jefe_mant'@'localhost',
'jefe_pdb'@'localhost',
'jefe_for'@'localhost',
'jefe_adm'@'localhost';

SET DEFAULT ROLE 'role_admin' TO 'admin'@'localhost';
SET DEFAULT ROLE 'role_contable' TO 'contable'@'localhost';
SET DEFAULT ROLE 'role_jefe' TO 
'jefe_info'@'localhost',
'jefe_meca'@'localhost',
'jefe_elta'@'localhost',
'jefe_auto'@'localhost',
'jefe_fpgb'@'localhost',
'jefe_tele'@'localhost',
'jefe_robo'@'localhost',
'jefe_pri'@'localhost',
'jefe_inf'@'localhost',
'jefe_eso'@'localhost',
'jefe_bac'@'localhost',
'jefe_sat'@'localhost',
'jefe_mant'@'localhost',
'jefe_pdb'@'localhost',
'jefe_for'@'localhost',
'jefe_adm'@'localhost';

FLUSH PRIVILEGES; -- para refrescar memoria cacheada

