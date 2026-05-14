package com.edugestion.dao;

import com.edugestion.model.User;
import com.edugestion.util.ConexionBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UserDAO {

    // ── Buscar por ID ────────────────────────────────────────
    public User findById(int idUser) throws SQLException {
        String sql = "SELECT * FROM `user` WHERE Id_user = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, idUser);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    // ── Buscar por email (login) ─────────────────────────────
    public User findByEmail(String email) throws SQLException {
        String sql = "SELECT * FROM `user` WHERE Email = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    // ── Usuarios de un departamento ──────────────────────────
    public List<User> findByDepartment(int codeDept) throws SQLException {
        String sql = "SELECT * FROM `user` WHERE Code_dept = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            return collect(ps.executeQuery());
        }
    }

    // ── Internos ─────────────────────────────────────────────
    private List<User> collect(ResultSet rs) throws SQLException {
        List<User> list = new ArrayList<>();
        while (rs.next()) list.add(map(rs));
        return list;
    }

    private User map(ResultSet rs) throws SQLException {
        User u = new User();
        u.setIdUser(rs.getInt("Id_user"));
        u.setName(rs.getString("Name"));
        u.setEmail(rs.getString("Email"));
        u.setPassword(rs.getString("Password"));
        u.setCodeDept(nullableInt(rs, "Code_dept"));
        u.setCodeRole(nullableInt(rs, "Code_role"));
        return u;
    }

    private static Integer nullableInt(ResultSet rs, String col) throws SQLException {
        int v = rs.getInt(col);
        return rs.wasNull() ? null : v;
    }
}
