package com.edugestion.servlet;

import com.edugestion.dao.DepartmentDAO;
import com.edugestion.model.Department;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

@WebServlet("/DepartmentServlet")
public class DepartmentServlet extends HttpServlet {

    // GET ?id=X → un departamento por ID (requiere sesión)
    // GET       → todos los departamentos (público, usado en el registro)
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json;charset=UTF-8");
        String idParam = request.getParameter("id");

        try {
            if (idParam != null) {
                // Endpoint protegido: requiere sesión
                HttpSession session = request.getSession(false);
                if (session == null || session.getAttribute("usuarioId") == null) {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
                Department dept = new DepartmentDAO().findById(Integer.parseInt(idParam));
                if (dept == null) {
                    response.sendError(HttpServletResponse.SC_NOT_FOUND);
                    return;
                }
                response.getWriter().write(toJson(dept));
            } else {
                // Listado completo: público (necesario para el formulario de registro)
                List<Department> list = new DepartmentDAO().findAll();
                StringBuilder json = new StringBuilder("[");
                for (int i = 0; i < list.size(); i++) {
                    json.append(toJson(list.get(i)));
                    if (i < list.size() - 1) json.append(",");
                }
                json.append("]");
                response.getWriter().write(json.toString());
            }
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private String toJson(Department d) {
        return "{\"codeDept\":" + d.getCodeDept() + ",\"name\":\"" + esc(d.getName()) + "\"}";
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
