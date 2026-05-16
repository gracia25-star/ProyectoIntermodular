package com.edugestion.dao;

import com.edugestion.model.PurchaseOrder;
import com.edugestion.util.ConexionBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PurchaseOrderDAO {

    // ── Crear orden — devuelve el Code_order generado ────────
    public int createOrder(PurchaseOrder order) throws SQLException {
        String sql = "INSERT INTO purchase_order " +
                     "(Order_reference, Description, Amount, Id_budget, Id_supplier, Status) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, order.getOrderReference());
            ps.setString(2, order.getDescription());
            ps.setBigDecimal(3, order.getAmount());
            ps.setObject(4, order.getIdBudget());
            ps.setObject(5, order.getIdSupplier());
            ps.setString(6, order.getStatus() != null ? order.getStatus() : "pending");
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                return rs.next() ? rs.getInt(1) : -1;
            }
        }
    }

    // ── Actualizar orden ─────────────────────────────────────
    public void updateOrder(PurchaseOrder order) throws SQLException {
        String sql = "UPDATE purchase_order SET Description = ?, Amount = ?, " +
                     "Id_budget = ?, Id_supplier = ?, Status = ?, Comment = ? " +
                     "WHERE Code_order = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, order.getDescription());
            ps.setBigDecimal(2, order.getAmount());
            ps.setObject(3, order.getIdBudget());
            ps.setObject(4, order.getIdSupplier());
            ps.setString(5, order.getStatus());
            ps.setString(6, order.getComment());
            ps.setInt(7, order.getCodeOrder());
            ps.executeUpdate();
        }
    }

    // ── Eliminar orden ───────────────────────────────────────
    public void deleteOrder(int codeOrder) throws SQLException {
        String sql = "DELETE FROM purchase_order WHERE Code_order = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeOrder);
            ps.executeUpdate();
        }
    }

    // ── Buscar por ID ────────────────────────────────────────
    public PurchaseOrder findById(int codeOrder) throws SQLException {
        String sql = "SELECT * FROM purchase_order WHERE Code_order = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeOrder);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    // ── Todas las órdenes (admin) ────────────────────────────
    public List<PurchaseOrder> findAll() throws SQLException {
        String sql = "SELECT * FROM purchase_order ORDER BY Date DESC";
        return query(sql);
    }

    // ── Órdenes por departamento ─────────────────────────────
    public List<PurchaseOrder> findByDepartment(int codeDept) throws SQLException {
        String sql = "SELECT po.* FROM purchase_order po " +
                     "JOIN budget b ON po.Id_budget = b.Id_budget " +
                     "WHERE b.Code_dept = ? ORDER BY po.Date DESC";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            return collect(ps.executeQuery());
        }
    }

    // ── Órdenes del usuario (vía SP GetOrdersByUser) ─────────
    public List<PurchaseOrder> findByUser(int idUser) throws SQLException {
        try (Connection con = ConexionBD.getConnection();
             CallableStatement cs = con.prepareCall("{CALL GetOrdersByUser(?)}")) {
            cs.setInt(1, idUser);
            return collect(cs.executeQuery());
        }
    }

    // ── Histórico por año y departamento ─────────────────────
    public List<PurchaseOrder> findByYear(int year, int codeDept) throws SQLException {
        String sql = "SELECT po.* FROM purchase_order po " +
                     "JOIN budget b ON po.Id_budget = b.Id_budget " +
                     "WHERE YEAR(po.Date) = ? AND b.Code_dept = ? ORDER BY po.Date DESC";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, year);
            ps.setInt(2, codeDept);
            return collect(ps.executeQuery());
        }
    }

    // ── Histórico admin: todas las órdenes de un año ─────────
    public List<PurchaseOrder> findByYear(int year) throws SQLException {
        String sql = "SELECT * FROM purchase_order WHERE YEAR(Date) = ? ORDER BY Date DESC";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, year);
            return collect(ps.executeQuery());
        }
    }

    // ── Nº de órdenes de un dpto en un año (para correlativo)
    public int countByDeptAndYear(int codeDept, int year) throws SQLException {
        String sql = "SELECT COUNT(*) FROM purchase_order po " +
                     "JOIN budget b ON po.Id_budget = b.Id_budget " +
                     "WHERE b.Code_dept = ? AND YEAR(po.Date) = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            ps.setInt(2, year);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    // ── Aprobar orden ────────────────────────────────────────
    public void approveOrder(int codeOrder) throws SQLException {
        String sql = "UPDATE purchase_order SET Status = 'approved' WHERE Code_order = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeOrder);
            ps.executeUpdate();
        }
    }

    // ── Actualizar estado de una orden ───────────────────────
    public void updateStatus(int codeOrder, String status) throws SQLException {
        String sql = "UPDATE purchase_order SET Status = ? WHERE Code_order = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setInt(2, codeOrder);
            ps.executeUpdate();
        }
    }

    // ── Añadir/actualizar comentario del admin ───────────────
    public void addComment(int codeOrder, String comment) throws SQLException {
        String sql = "UPDATE purchase_order SET Comment = ? WHERE Code_order = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, comment);
            ps.setInt(2, codeOrder);
            ps.executeUpdate();
        }
    }

    // ── Internos ─────────────────────────────────────────────
    private List<PurchaseOrder> query(String sql) throws SQLException {
        try (Connection con = ConexionBD.getConnection();
             Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            return collect(rs);
        }
    }

    private List<PurchaseOrder> collect(ResultSet rs) throws SQLException {
        List<PurchaseOrder> list = new ArrayList<>();
        while (rs.next()) list.add(map(rs));
        return list;
    }

    private PurchaseOrder map(ResultSet rs) throws SQLException {
        PurchaseOrder o = new PurchaseOrder();
        o.setCodeOrder(rs.getInt("Code_order"));
        o.setOrderReference(rs.getString("Order_reference"));
        o.setDescription(rs.getString("Description"));
        o.setDate(rs.getTimestamp("Date"));
        o.setAmount(rs.getBigDecimal("Amount"));
        o.setIdBudget(nullableInt(rs, "Id_budget"));
        o.setIdSupplier(nullableInt(rs, "Id_supplier"));
        o.setStatus(rs.getString("Status"));
        o.setComment(rs.getString("Comment"));
        return o;
    }

    private static Integer nullableInt(ResultSet rs, String col) throws SQLException {
        int v = rs.getInt(col);
        return rs.wasNull() ? null : v;
    }
}
