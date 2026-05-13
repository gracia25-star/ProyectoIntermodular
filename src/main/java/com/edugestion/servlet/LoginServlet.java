package com.edugestion.servlet;

import com.edugestion.util.ConexionBD;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@WebServlet("/LoginServlet")
public class LoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        String usuario = request.getParameter("usuario");
        String contrasena = request.getParameter("contrasena");

        try (Connection con = ConexionBD.getConnection()) {
            String sql = "SELECT u.Id_user, u.Name AS userName, r.Name AS roleName " +
                         "FROM `user` u LEFT JOIN role r ON u.Code_role = r.Code_role " +
                         "WHERE u.Email = ? AND u.`Password` = ?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, usuario);
            ps.setString(2, contrasena);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                String role = rs.getString("roleName");
                HttpSession session = request.getSession();
                session.setAttribute("usuarioId", rs.getInt("Id_user"));
                session.setAttribute("usuario", usuario);
                session.setAttribute("nombre", rs.getString("userName"));
                session.setAttribute("role", role);

                if ("dept_manager".equals(role)) {
                    response.sendRedirect("viewMenu.html");
                } else {
                    response.sendRedirect("viewMenuAdmin.html");
                }
            } else {
                response.sendRedirect("viewRegistro.html?error=credenciales");
            }

        } catch (SQLException e) {
            e.printStackTrace();
            response.sendRedirect("viewRegistro.html?error=servidor");
        }
    }
}
