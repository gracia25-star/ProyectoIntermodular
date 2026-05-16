package com.edugestion.dao;

import com.edugestion.model.Supplier;
import com.edugestion.util.ConexionBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SupplierDAO {

    // ── Todos los proveedores ────────────────────────────────
    public List<Supplier> findAll() throws SQLException {
        String sql = "SELECT * FROM supplier ORDER BY Name";
        try (Connection con = ConexionBD.getConnection();
             Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            return collect(rs);
        }
    }

    // ── Buscar por ID ────────────────────────────────────────
    public Supplier findById(int idSupplier) throws SQLException {
        String sql = "SELECT * FROM supplier WHERE Id_supplier = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, idSupplier);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        }
    }

    // ── Proveedores de un departamento ───────────────────────
    public List<Supplier> findByDepartment(int codeDept) throws SQLException {
        String sql = "SELECT s.* FROM supplier s " +
                     "JOIN Dept_Supplier ds ON s.Id_supplier = ds.Id_supplier " +
                     "WHERE ds.Code_dept = ? ORDER BY s.Name";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            return collect(ps.executeQuery());
        }
    }

    // ── Proveedores del usuario (vía SP GetSuppliersByUser) ──
    public List<Supplier> findByUser(int idUser) throws SQLException {
        try (Connection con = ConexionBD.getConnection();
             CallableStatement cs = con.prepareCall("{CALL GetSuppliersByUser(?)}")) {
            cs.setInt(1, idUser);
            return collect(cs.executeQuery());
        }
    }

    // ── Crear proveedor (devuelve ID generado) ───────────────
    public int insert(Supplier supplier) throws SQLException {
        String sql = "INSERT INTO supplier (Name, CIF, Address, Phone, Mail) VALUES (?, ?, ?, ?, ?)";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, supplier.getName());
            ps.setString(2, supplier.getCif());
            ps.setString(3, supplier.getAddress());
            ps.setString(4, supplier.getPhone());
            ps.setString(5, supplier.getMail());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                return rs.next() ? rs.getInt(1) : -1;
            }
        }
    }

    // ── Crear proveedor (sin devolver ID — compatibilidad) ───
    public void createSupplier(Supplier supplier) throws SQLException {
        insert(supplier);
    }

    // ── Actualizar proveedor ─────────────────────────────────
    public void updateSupplier(Supplier supplier) throws SQLException {
        String sql = "UPDATE supplier SET Name = ?, CIF = ?, Address = ?, Phone = ?, Mail = ? " +
                     "WHERE Id_supplier = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, supplier.getName());
            ps.setString(2, supplier.getCif());
            ps.setString(3, supplier.getAddress());
            ps.setString(4, supplier.getPhone());
            ps.setString(5, supplier.getMail());
            ps.setInt(6, supplier.getIdSupplier());
            ps.executeUpdate();
        }
    }

    // ── Eliminar proveedor ───────────────────────────────────
    public void deleteSupplier(int idSupplier) throws SQLException {
        String sql = "DELETE FROM supplier WHERE Id_supplier = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, idSupplier);
            ps.executeUpdate();
        }
    }

    // ── Internos ─────────────────────────────────────────────
    private List<Supplier> collect(ResultSet rs) throws SQLException {
        List<Supplier> list = new ArrayList<>();
        while (rs.next()) list.add(map(rs));
        return list;
    }

    private Supplier map(ResultSet rs) throws SQLException {
        Supplier s = new Supplier();
        s.setIdSupplier(rs.getInt("Id_supplier"));
        s.setName(rs.getString("Name"));
        s.setCif(rs.getString("CIF"));
        s.setAddress(rs.getString("Address"));
        s.setPhone(rs.getString("Phone"));
        s.setMail(rs.getString("Mail"));
        return s;
    }
}
