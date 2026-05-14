package com.edugestion.dao;

import com.edugestion.model.Department;
import com.edugestion.util.ConexionBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DepartmentDAO {

    // ── Todos los departamentos ──────────────────────────────
    public List<Department> findAll() throws SQLException {
        String sql = "SELECT * FROM department ORDER BY Name";
        try (Connection con = ConexionBD.getConnection();
             Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            return collect(rs);
        }
    }

    // ── Buscar por ID ────────────────────────────────────────
    public Department findById(int codeDept) throws SQLException {
        String sql = "SELECT * FROM department WHERE Code_dept = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    // ── Internos ─────────────────────────────────────────────
    private List<Department> collect(ResultSet rs) throws SQLException {
        List<Department> list = new ArrayList<>();
        while (rs.next()) list.add(map(rs));
        return list;
    }

    private Department map(ResultSet rs) throws SQLException {
        return new Department(rs.getInt("Code_dept"), rs.getString("Name"));
    }
}
