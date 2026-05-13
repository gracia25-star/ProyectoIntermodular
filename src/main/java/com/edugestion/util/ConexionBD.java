package com.edugestion.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class ConexionBD {

    private static final String URL = "jdbc:mysql://localhost:3306/departments";
    private static final String USUARIO = "root";
    private static final String CONTRASENA = "123456";

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new SQLException("Driver MySQL no encontrado. Añade mysql-connector-j a WEB-INF/lib/", e);
        }
        return DriverManager.getConnection(URL, USUARIO, CONTRASENA);
    }
}
