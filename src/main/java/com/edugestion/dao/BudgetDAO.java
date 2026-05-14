package com.edugestion.dao;

import com.edugestion.model.Budget;
import com.edugestion.util.ConexionBD;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BudgetDAO {

    // ── Todos los presupuestos (admin) ───────────────────────
    public List<Budget> findAll() throws SQLException {
        String sql = "SELECT * FROM budget ORDER BY Year DESC, Code_dept";
        return query(sql);
    }

    // ── Buscar por ID ────────────────────────────────────────
    public Budget findById(int idBudget) throws SQLException {
        String sql = "SELECT * FROM budget WHERE Id_budget = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, idBudget);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    // ── Presupuestos de un departamento ─────────────────────
    public List<Budget> findByDepartment(int codeDept) throws SQLException {
        String sql = "SELECT * FROM budget WHERE Code_dept = ? ORDER BY Year DESC, Type";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            return collect(ps.executeQuery());
        }
    }

    // ── Presupuestos del usuario (vía SP GetBudgetsByUser) ───
    public List<Budget> findByUser(int idUser) throws SQLException {
        try (Connection con = ConexionBD.getConnection();
             CallableStatement cs = con.prepareCall("{CALL GetBudgetsByUser(?)}")) {
            cs.setInt(1, idUser);
            return collect(cs.executeQuery());
        }
    }

    // ── Presupuesto de un dpto por tipo y año ────────────────
    // type: 1 = General, 2 = Plan de Inversión
    public Budget findByDeptAndType(int codeDept, int type, int year) throws SQLException {
        String sql = "SELECT * FROM budget WHERE Code_dept = ? AND Type = ? AND Year = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            ps.setInt(2, type);
            ps.setInt(3, year);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    // ── Presupuestos de un año ───────────────────────────────
    public List<Budget> findByYear(int year) throws SQLException {
        String sql = "SELECT * FROM budget WHERE Year = ? ORDER BY Code_dept, Type";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, year);
            return collect(ps.executeQuery());
        }
    }

    // ── Importe gastado de un presupuesto ────────────────────
    public BigDecimal getSpentAmount(int idBudget) throws SQLException {
        String sql = "SELECT COALESCE(SUM(Amount), 0) FROM purchase_order WHERE Id_budget = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, idBudget);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getBigDecimal(1);
            }
        }
    }

    // ── Importe restante de un presupuesto ───────────────────
    public BigDecimal getRemainingAmount(int idBudget) throws SQLException {
        Budget b = findById(idBudget);
        if (b == null) return BigDecimal.ZERO;
        return b.getTotalAmount().subtract(getSpentAmount(idBudget));
    }

    // ── Internos ─────────────────────────────────────────────
    private List<Budget> query(String sql) throws SQLException {
        try (Connection con = ConexionBD.getConnection();
             Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            return collect(rs);
        }
    }

    private List<Budget> collect(ResultSet rs) throws SQLException {
        List<Budget> list = new ArrayList<>();
        while (rs.next()) list.add(map(rs));
        return list;
    }

    private Budget map(ResultSet rs) throws SQLException {
        Budget b = new Budget();
        b.setIdBudget(rs.getInt("Id_budget"));
        b.setTotalAmount(rs.getBigDecimal("Total_amount"));
        b.setYear(rs.getInt("Year"));
        b.setType(rs.getInt("Type"));
        b.setCodeDept(nullableInt(rs, "Code_dept"));
        return b;
    }

    private static Integer nullableInt(ResultSet rs, String col) throws SQLException {
        int v = rs.getInt(col);
        return rs.wasNull() ? null : v;
    }
}
