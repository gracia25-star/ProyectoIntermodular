package com.edugestion.servlet;

import com.edugestion.dao.DeptSupplierDAO;
import com.edugestion.model.Supplier;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

@WebServlet("/DeptSupplierServlet")
public class DeptSupplierServlet extends HttpServlet {

    // GET ?codeDept=X → proveedores asignados al departamento
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String codeDeptParam = request.getParameter("codeDept");
        if (codeDeptParam == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        response.setContentType("application/json;charset=UTF-8");

        try {
            int codeDept = Integer.parseInt(codeDeptParam);
            List<Supplier> suppliers = new DeptSupplierDAO().findSuppliersByDepartment(codeDept);

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

        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    // POST action=assign|remove & codeDept=X & idSupplier=Y
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        try {
            int codeDept   = Integer.parseInt(request.getParameter("codeDept"));
            int idSupplier = Integer.parseInt(request.getParameter("idSupplier"));
            String action  = request.getParameter("action");

            DeptSupplierDAO dao = new DeptSupplierDAO();
            if ("remove".equals(action)) {
                dao.removeSupplierFromDepartment(codeDept, idSupplier);
            } else {
                dao.assignSupplierToDepartment(codeDept, idSupplier);
            }

            response.getWriter().write("{\"ok\":true}");

        } catch (NumberFormatException e) {
            json(response, false, "Parámetros incorrectos.");
        } catch (SQLException e) {
            e.printStackTrace();
            json(response, false, "Error de base de datos: " + esc(e.getMessage()));
        }
    }

    private void json(HttpServletResponse response, boolean ok, String msg) throws IOException {
        response.getWriter().write("{\"ok\":" + ok + ",\"error\":\"" + esc(msg) + "\"}");
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
