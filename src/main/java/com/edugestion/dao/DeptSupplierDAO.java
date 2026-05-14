package com.edugestion.dao;

import com.edugestion.model.DeptSupplier;
import com.edugestion.model.Supplier;
import com.edugestion.util.ConexionBD;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DeptSupplierDAO {

    // ── Asignar proveedor a un departamento ──────────────────
    public void assignSupplierToDepartment(int codeDept, int idSupplier) throws SQLException {
        String sql = "INSERT IGNORE INTO Dept_Supplier (Code_dept, Id_supplier) VALUES (?, ?)";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            ps.setInt(2, idSupplier);
            ps.executeUpdate();
        }
    }

    // ── Desasignar proveedor de un departamento ──────────────
    public void removeSupplierFromDepartment(int codeDept, int idSupplier) throws SQLException {
        String sql = "DELETE FROM Dept_Supplier WHERE Code_dept = ? AND Id_supplier = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            ps.setInt(2, idSupplier);
            ps.executeUpdate();
        }
    }

    // ── Proveedores de un departamento (con datos completos) ─
    public List<Supplier> findSuppliersByDepartment(int codeDept) throws SQLException {
        String sql = "SELECT s.* FROM supplier s " +
                     "JOIN Dept_Supplier ds ON s.Id_supplier = ds.Id_supplier " +
                     "WHERE ds.Code_dept = ? ORDER BY s.Name";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            List<Supplier> list = new ArrayList<>();
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Supplier s = new Supplier();
                    s.setIdSupplier(rs.getInt("Id_supplier"));
                    s.setName(rs.getString("Name"));
                    s.setCif(rs.getString("CIF"));
                    s.setAddress(rs.getString("Address"));
                    s.setPhone(rs.getString("Phone"));
                    s.setMail(rs.getString("Mail"));
                    list.add(s);
                }
            }
            return list;
        }
    }

    // ── Relaciones de un departamento (IDs únicamente) ───────
    public List<DeptSupplier> findByDepartment(int codeDept) throws SQLException {
        String sql = "SELECT * FROM Dept_Supplier WHERE Code_dept = ?";
        try (Connection con = ConexionBD.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, codeDept);
            List<DeptSupplier> list = new ArrayList<>();
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new DeptSupplier(rs.getInt("Code_dept"), rs.getInt("Id_supplier")));
                }
            }
            return list;
        }
    }
}
