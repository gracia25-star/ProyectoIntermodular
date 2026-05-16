package com.edugestion.servlet;

import com.edugestion.dao.DeptSupplierDAO;
import com.edugestion.dao.DepartmentDAO;
import com.edugestion.dao.SupplierDAO;
import com.edugestion.model.Department;
import com.edugestion.model.Supplier;
import com.edugestion.util.ConexionBD;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.*;
import java.util.List;

@WebServlet("/SupplierServlet")
public class SupplierServlet extends HttpServlet {

    /**
     * GET /SupplierServlet            → todos (admin/accountant) con dept_names, o del usuario (dept_manager)
     * GET /SupplierServlet?codeDept=X → filtrar por departamento (admin/accountant)
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String role   = (String) session.getAttribute("role");
        int    idUser = (int)    session.getAttribute("usuarioId");
        String codeDeptParam = request.getParameter("codeDept");

        response.setContentType("application/json;charset=UTF-8");

        try {
            if ("dept_manager".equals(role)) {
                List<Supplier> list = new SupplierDAO().findByUser(idUser);
                response.getWriter().write(toJsonSimple(list));

            } else if (codeDeptParam != null && !codeDeptParam.isBlank()) {
                int codeDept = Integer.parseInt(codeDeptParam);
                if ("admin".equals(role)) {
                    response.getWriter().write(getWithDeptsFiltered(codeDept));
                } else {
                    List<Supplier> list = new SupplierDAO().findByDepartment(codeDept);
                    response.getWriter().write(toJsonSimple(list));
                }
            } else {
                if ("admin".equals(role)) {
                    response.getWriter().write(getWithDeptsAll());
                } else {
                    // accountant: todos, sin dept_names
                    List<Supplier> list = new SupplierDAO().findAll();
                    response.getWriter().write(toJsonSimple(list));
                }
            }

        } catch (SQLException | NumberFormatException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    /** Todos los proveedores con sus departamentos (GROUP_CONCAT). */
    private String getWithDeptsAll() throws SQLException {
        String sql =
            "SELECT s.Id_supplier, s.Name, s.CIF, s.Address, s.Phone, s.Mail, " +
            "GROUP_CONCAT(d.Name ORDER BY d.Name SEPARATOR ', ') AS dept_names " +
            "FROM supplier s " +
            "LEFT JOIN Dept_Supplier ds ON s.Id_supplier = ds.Id_supplier " +
            "LEFT JOIN department d ON ds.Code_dept = d.Code_dept " +
            "GROUP BY s.Id_supplier ORDER BY s.Name";
        return queryRich(sql, null);
    }

    /** Proveedores del departamento indicado, mostrando todos sus deptos asociados. */
    private String getWithDeptsFiltered(int codeDept) throws SQLException {
        String sql =
            "SELECT s.Id_supplier, s.Name, s.CIF, s.Address, s.Phone, s.Mail, " +
            "GROUP_CONCAT(d.Name ORDER BY d.Name SEPARATOR ', ') AS dept_names " +
            "FROM supplier s " +
            "LEFT JOIN Dept_Supplier ds_all ON s.Id_supplier = ds_all.Id_supplier " +
            "LEFT JOIN department d ON ds_all.Code_dept = d.Code_dept " +
            "WHERE s.Id_supplier IN " +
            "  (SELECT Id_supplier FROM Dept_Supplier WHERE Code_dept = ?) " +
            "GROUP BY s.Id_supplier ORDER BY s.Name";
        return queryRich(sql, codeDept);
    }

    private String queryRich(String sql, Integer codeDept) throws SQLException {
        try (Connection con = ConexionBD.getConnection()) {
            PreparedStatement ps;
            if (codeDept != null) {
                ps = con.prepareStatement(sql);
                ps.setInt(1, codeDept);
            } else {
                ps = con.prepareStatement(sql);
            }
            try (ResultSet rs = ps.executeQuery()) {
                StringBuilder json = new StringBuilder("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    String deptNames = rs.getString("dept_names");
                    json.append("{")
                        .append("\"idSupplier\":").append(rs.getInt("Id_supplier")).append(",")
                        .append("\"name\":\"").append(esc(rs.getString("Name"))).append("\",")
                        .append("\"cif\":\"").append(esc(rs.getString("CIF"))).append("\",")
                        .append("\"phone\":\"").append(esc(rs.getString("Phone"))).append("\",")
                        .append("\"mail\":\"").append(esc(rs.getString("Mail"))).append("\",")
                        .append("\"address\":\"").append(esc(rs.getString("Address"))).append("\",")
                        .append("\"deptNames\":\"").append(esc(deptNames != null ? deptNames : "Sin asignar")).append("\"")
                        .append("}");
                    first = false;
                }
                json.append("]");
                return json.toString();
            }
        }
    }

    private String toJsonSimple(List<Supplier> list) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            Supplier s = list.get(i);
            json.append("{")
                .append("\"idSupplier\":").append(s.getIdSupplier()).append(",")
                .append("\"name\":\"").append(esc(s.getName())).append("\",")
                .append("\"cif\":\"").append(esc(s.getCif())).append("\",")
                .append("\"phone\":\"").append(esc(s.getPhone())).append("\",")
                .append("\"mail\":\"").append(esc(s.getMail())).append("\",")
                .append("\"address\":\"").append(esc(s.getAddress())).append("\"")
                .append("}");
            if (i < list.size() - 1) json.append(",");
        }
        json.append("]");
        return json.toString();
    }

    /**
     * POST /SupplierServlet — crear proveedor y asignarlo a un departamento (solo admin).
     * Params: name, cif, mail, phone, address, codeDept
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session == null || !"admin".equals(session.getAttribute("role"))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        request.setCharacterEncoding("UTF-8");
        String name    = request.getParameter("name");
        String cif     = request.getParameter("cif");
        String mail    = request.getParameter("mail");
        String phone   = request.getParameter("phone");
        String address = request.getParameter("address");
        String codeDeptParam = request.getParameter("codeDept");

        if (name == null || cif == null || mail == null || phone == null
                || codeDeptParam == null || codeDeptParam.isBlank()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Faltan campos obligatorios");
            return;
        }

        try {
            Supplier s = new Supplier();
            s.setName(name.trim());
            s.setCif(cif.trim());
            s.setMail(mail.trim());
            s.setPhone(phone.trim());
            s.setAddress(address != null ? address.trim() : "");

            int newId = new SupplierDAO().insert(s);
            s.setIdSupplier(newId);

            int codeDept = Integer.parseInt(codeDeptParam);
            new DeptSupplierDAO().assignSupplierToDepartment(codeDept, newId);

            Department dept = new DepartmentDAO().findById(codeDept);
            String deptName = dept != null ? dept.getName() : "—";

            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                "{\"idSupplier\":" + newId +
                ",\"name\":\"" + esc(s.getName()) + "\"" +
                ",\"cif\":\"" + esc(s.getCif()) + "\"" +
                ",\"phone\":\"" + esc(s.getPhone()) + "\"" +
                ",\"mail\":\"" + esc(s.getMail()) + "\"" +
                ",\"address\":\"" + esc(s.getAddress()) + "\"" +
                ",\"deptNames\":\"" + esc(deptName) + "\"}"
            );

        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "codeDept inválido");
        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * DELETE /SupplierServlet?id=X — eliminar proveedor (solo admin).
     */
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session == null || !"admin".equals(session.getAttribute("role"))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String idParam = request.getParameter("id");
        if (idParam == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        try {
            new SupplierDAO().deleteSupplier(Integer.parseInt(idParam));
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"ok\":true}");
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
