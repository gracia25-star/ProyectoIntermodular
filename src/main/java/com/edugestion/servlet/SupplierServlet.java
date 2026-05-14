package com.edugestion.servlet;

import com.edugestion.dao.SupplierDAO;
import com.edugestion.model.Supplier;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

@WebServlet("/SupplierServlet")
public class SupplierServlet extends HttpServlet {

    // ── GET: proveedores del usuario (filtrados por su dpto) ─
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        int idUser = (int) session.getAttribute("usuarioId");
        response.setContentType("application/json;charset=UTF-8");

        try {
            List<Supplier> suppliers = new SupplierDAO().findByUser(idUser);

            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < suppliers.size(); i++) {
                Supplier s = suppliers.get(i);
                json.append("{")
                    .append("\"idSupplier\":").append(s.getIdSupplier()).append(",")
                    .append("\"name\":\"").append(esc(s.getName())).append("\",")
                    .append("\"cif\":\"").append(esc(s.getCif())).append("\",")
                    .append("\"phone\":\"").append(esc(s.getPhone())).append("\",")
                    .append("\"mail\":\"").append(esc(s.getMail())).append("\",")
                    .append("\"address\":\"").append(esc(s.getAddress())).append("\"")
                    .append("}");
                if (i < suppliers.size() - 1) json.append(",");
            }
            json.append("]");
            response.getWriter().write(json.toString());

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
