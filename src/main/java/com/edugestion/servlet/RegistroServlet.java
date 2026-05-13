package com.edugestion.servlet;

import com.edugestion.util.ConexionBD;
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
        String nombre = request.getParameter("nombre");
        String gmail = request.getParameter("gmail");
        String contrasena = request.getParameter("contrasena");

        try (Connection con = ConexionBD.getConnection()) {
            String checkSql = "SELECT Id_user FROM `user` WHERE Email = ?";
            PreparedStatement checkPs = con.prepareStatement(checkSql);
            checkPs.setString(1, gmail);
            ResultSet rs = checkPs.executeQuery();

            if (rs.next()) {
                response.sendRedirect("viewRegistro.html?error=email_existe");
                return;
            }

            // Code_role = 3 → dept_manager
            String sql = "INSERT INTO `user` (Name, Email, `Password`,Code_dept, Code_role) VALUES (?, ?, ?, 3, 3)";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, nombre);
            ps.setString(2, gmail);
            ps.setString(3, contrasena);
            ps.executeUpdate();

            response.sendRedirect("viewRegistro.html?registro=ok");

        } catch (SQLException e) {
            e.printStackTrace();
            response.sendRedirect("viewRegistro.html?error=servidor");
        }
    }
}
