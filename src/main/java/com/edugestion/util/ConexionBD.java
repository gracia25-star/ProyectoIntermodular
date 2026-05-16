package com.edugestion.util;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class ConexionBD {

    private static final String URL;
    private static final String USUARIO;
    private static final String CONTRASENA;

    static {
        Properties props = new Properties();
        try (InputStream is = ConexionBD.class.getClassLoader()
                .getResourceAsStream("db.properties")) {
            if (is == null) throw new RuntimeException(
                "No se encontró db.properties en el classpath");
            props.load(is);
        } catch (IOException e) {
            throw new RuntimeException("Error leyendo db.properties", e);
        }
        URL       = props.getProperty("db.url");
        USUARIO   = props.getProperty("db.usuario");
        CONTRASENA = props.getProperty("db.contrasena");
    }

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new SQLException("Driver MySQL no encontrado. Añade mysql-connector-j a WEB-INF/lib/", e);
        }
        return DriverManager.getConnection(URL, USUARIO, CONTRASENA);
    }
}
