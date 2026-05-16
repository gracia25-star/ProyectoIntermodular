package com.edugestion.dao;

import com.edugestion.model.Invoice;
import com.edugestion.util.ConexionBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class InvoiceDAO {

    // ── Subir factura ────────────────────────────────────────
    public void uploadInvoice(Invoice invoice) throws SQLException {
        String sql = "INSERT INTO invoice (Date, Total_amount, PDF_file, Code_order) VALUES (?, ?, ?, ?)";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setTimestamp(1, invoice.getDate());
            ps.setBigDecimal(2, invoice.getTotalAmount());
            ps.setBytes(3, invoice.getPdfFile());
            ps.setObject(4, invoice.getCodeOrder());
            ps.executeUpdate();
        }
    }

    // ── Facturas de una orden ────────────────────────────────
    public List<Invoice> findByOrder(int codeOrder) throws SQLException {
        String sql = "SELECT * FROM invoice WHERE Code_order = ? ORDER BY Date DESC";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeOrder);
            return collect(ps.executeQuery());
        }
    }

    // ── Facturas de un departamento ──────────────────────────
    public List<Invoice> findByDepartment(int codeDept) throws SQLException {
        String sql = "SELECT i.* FROM invoice i " +
                     "JOIN purchase_order po ON i.Code_order = po.Code_order " +
                     "JOIN budget b ON po.Id_budget = b.Id_budget " +
                     "WHERE b.Code_dept = ? ORDER BY i.Date DESC";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            return collect(ps.executeQuery());
        }
    }

    // ── Facturas del usuario (vía SP GetInvoicesByUser) ──────
    public List<Invoice> findByUser(int idUser) throws SQLException {
        try (Connection con = ConexionBD.getConnection();
             CallableStatement cs = con.prepareCall("{CALL GetInvoicesByUser(?)}")) {
            cs.setInt(1, idUser);
            return collect(cs.executeQuery());
        }
    }

    // ── Factura por ID (incluye PDF) ─────────────────────────
    public Invoice findById(int codeInvoice) throws SQLException {
        String sql = "SELECT * FROM invoice WHERE Code_invoice = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeInvoice);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    // ── Metadatos de facturas de una orden (sin BLOB) ────────
    public List<Invoice> findByOrderMeta(int codeOrder) throws SQLException {
        String sql = "SELECT Code_invoice, Date, Total_amount, Code_order " +
                     "FROM invoice WHERE Code_order = ? ORDER BY Date DESC";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeOrder);
            try (ResultSet rs = ps.executeQuery()) {
                List<Invoice> list = new ArrayList<>();
                while (rs.next()) {
                    Invoice inv = new Invoice();
                    inv.setCodeInvoice(rs.getInt("Code_invoice"));
                    inv.setDate(rs.getTimestamp("Date"));
                    inv.setTotalAmount(rs.getBigDecimal("Total_amount"));
                    inv.setCodeOrder(nullableInt(rs, "Code_order"));
                    list.add(inv);
                }
                return list;
            }
        }
    }

    // ── Contar facturas de una orden ─────────────────────────
    public int countByOrder(int codeOrder) throws SQLException {
        String sql = "SELECT COUNT(*) FROM invoice WHERE Code_order = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeOrder);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    // ── Eliminar factura ─────────────────────────────────────
    public void deleteInvoice(int codeInvoice) throws SQLException {
        String sql = "DELETE FROM invoice WHERE Code_invoice = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeInvoice);
            ps.executeUpdate();
        }
    }

    // ── Internos ─────────────────────────────────────────────
    private List<Invoice> collect(ResultSet rs) throws SQLException {
        List<Invoice> list = new ArrayList<>();
        while (rs.next()) list.add(map(rs));
        return list;
    }

    private Invoice map(ResultSet rs) throws SQLException {
        Invoice inv = new Invoice();
        inv.setCodeInvoice(rs.getInt("Code_invoice"));
        inv.setDate(rs.getTimestamp("Date"));
        inv.setTotalAmount(rs.getBigDecimal("Total_amount"));
        inv.setPdfFile(rs.getBytes("PDF_file"));
        inv.setCodeOrder(nullableInt(rs, "Code_order"));
        return inv;
    }

    private static Integer nullableInt(ResultSet rs, String col) throws SQLException {
        int v = rs.getInt(col);
        return rs.wasNull() ? null : v;
    }
}
