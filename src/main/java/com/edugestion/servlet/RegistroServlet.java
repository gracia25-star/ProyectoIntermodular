package com.edugestion.servlet;

import com.edugestion.util.ConexionBD;
import com.edugestion.util.PasswordUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@WebServlet("/RegistroServlet")
public class RegistroServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        String nombre    = request.getParameter("nombre");
        String gmail     = request.getParameter("gmail");
        String contrasena = request.getParameter("contrasena");
        String rolParam  = request.getParameter("rol");

        if (rolParam == null || rolParam.isBlank()) {
            response.sendRedirect("viewAdminUsuarios.html?error=rol_requerido");
            return;
        }

        // Determinar rol y departamento según la selección
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
                response.sendRedirect("viewAdminUsuarios.html?error=rol_invalido");
                return;
            }
            codeRole = 3;
        }

        try (Connection con = ConexionBD.getConnection()) {
            String checkSql = "SELECT Id_user FROM `user` WHERE Email = ?";
            PreparedStatement checkPs = con.prepareStatement(checkSql);
            checkPs.setString(1, gmail);
            ResultSet rs = checkPs.executeQuery();

            if (rs.next()) {
                response.sendRedirect("viewAdminUsuarios.html?error=email_existe");
                return;
            }

            String sql = "INSERT INTO `user` (Name, Email, `Password`, Code_dept, Code_role) VALUES (?, ?, ?, ?, ?)";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, nombre);
            ps.setString(2, gmail);
            ps.setString(3, PasswordUtil.hash(contrasena));
            ps.setObject(4, codeDept);
            ps.setInt(5, codeRole);
            ps.executeUpdate();

            response.sendRedirect("viewAdminUsuarios.html?registro=ok");

        } catch (SQLException e) {
            e.printStackTrace();
            response.sendRedirect("viewAdminUsuarios.html?error=servidor");
        }
    }
}
