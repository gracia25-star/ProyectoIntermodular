package com.edugestion.servlet;

import com.edugestion.util.ConexionBD;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/UsuariosServlet")
public class UsuariosServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try (Connection con = ConexionBD.getConnection()) {
            String sql = "SELECT u.Id_user, u.Name, u.Email, u.Code_role, u.Code_dept, " +
                         "r.Name AS RoleName, d.Name AS DeptName " +
                         "FROM `user` u " +
                         "LEFT JOIN `role` r ON u.Code_role = r.Code_role " +
                         "LEFT JOIN `department` d ON u.Code_dept = d.Code_dept";

            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();

            StringBuilder json = new StringBuilder("[");
            boolean first = true;
            while (rs.next()) {
                if (!first) json.append(",");
                first = false;

                String role = rs.getString("RoleName");
                String dept = rs.getString("DeptName");
                Object codeRole = rs.getObject("Code_role");
                Object codeDept = rs.getObject("Code_dept");

                json.append("{")
                    .append("\"id\":").append(rs.getInt("Id_user")).append(",")
                    .append("\"nombre\":\"").append(esc(rs.getString("Name"))).append("\",")
                    .append("\"email\":\"").append(esc(rs.getString("Email"))).append("\",")
                    .append("\"rol\":\"").append(role != null ? esc(role) : "—").append("\",")
                    .append("\"departamento\":\"").append(dept != null ? esc(dept) : "—").append("\",")
                    .append("\"codeRole\":").append(codeRole != null ? codeRole : "null").append(",")
                    .append("\"codeDept\":").append(codeDept != null ? codeDept : "null")
                    .append("}");
            }
            json.append("]");
            out.print(json.toString());

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"Error al cargar los usuarios\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            String idParam = request.getParameter("id");
            String nombre  = request.getParameter("nombre");
            String email   = request.getParameter("email");
            String rolParam = request.getParameter("rol");

            if (idParam == null || nombre == null || nombre.isBlank()
                    || email == null || email.isBlank()
                    || rolParam == null || rolParam.isBlank()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"ok\":false,\"error\":\"Campos incompletos\"}");
                return;
            }

            int id = Integer.parseInt(idParam);

            int codeRole;
            Integer codeDept;
            if ("admin".equals(rolParam)) {
                codeRole = 1;
                codeDept = null;
            } else if ("accountant".equals(rolParam)) {
                codeRole = 2;
                codeDept = null;
            } else {
                try {
                    codeDept = Integer.parseInt(rolParam);
                } catch (NumberFormatException e) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    out.print("{\"ok\":false,\"error\":\"Rol inválido\"}");
                    return;
                }
                codeRole = 3;
            }

            try (Connection con = ConexionBD.getConnection()) {
                String sql = "UPDATE `user` SET Name=?, Email=?, Code_role=?, Code_dept=? WHERE Id_user=?";
                PreparedStatement ps = con.prepareStatement(sql);
                ps.setString(1, nombre);
                ps.setString(2, email);
                ps.setInt(3, codeRole);
                ps.setObject(4, codeDept);
                ps.setInt(5, id);
                ps.executeUpdate();
                out.print("{\"ok\":true}");
            }

        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"ok\":false,\"error\":\"ID inválido\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"ok\":false,\"error\":\"Error al actualizar\"}");
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
