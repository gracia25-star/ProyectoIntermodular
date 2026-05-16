package com.edugestion.servlet;

import com.edugestion.util.ConexionBD;
import com.edugestion.util.PasswordUtil;
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
            String sql = "SELECT u.Id_user, u.Name AS userName, u.`Password` AS pwd, r.Name AS roleName, d.Name AS deptName " +
                         "FROM `user` u " +
                         "LEFT JOIN role r ON u.Code_role = r.Code_role " +
                         "LEFT JOIN department d ON u.Code_dept = d.Code_dept " +
                         "WHERE u.Email = ?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, usuario);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                String stored = rs.getString("pwd");
                boolean ok = PasswordUtil.verify(contrasena, stored);

                // Migración: contraseña antigua en texto plano → re-hashear al vuelo
                if (!ok && contrasena.equals(stored)) {
                    ok = true;
                    String newHash = PasswordUtil.hash(contrasena);
                    try (PreparedStatement upd = con.prepareStatement(
                            "UPDATE `user` SET `Password`=? WHERE Id_user=?")) {
                        upd.setString(1, newHash);
                        upd.setInt(2, rs.getInt("Id_user"));
                        upd.executeUpdate();
                    }
                }

                if (ok) {
                    String role = rs.getString("roleName");
                    HttpSession session = request.getSession();
                    session.setAttribute("usuarioId", rs.getInt("Id_user"));
                    session.setAttribute("usuario", usuario);
                    session.setAttribute("nombre", rs.getString("userName"));
                    session.setAttribute("role", role);
                    session.setAttribute("deptName", rs.getString("deptName"));

                    if ("dept_manager".equals(role)) {
                        response.sendRedirect("viewMenu.html");
                    } else {
                        response.sendRedirect("viewMenuAdmin.html");
                    }
                } else {
                    response.sendRedirect("viewRegistro.html?error=credenciales");
                }
            } else {
                response.sendRedirect("viewRegistro.html?error=credenciales");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.sendRedirect("viewRegistro.html?error=servidor");
        }
    }
}
