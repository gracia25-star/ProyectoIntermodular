package com.edugestion.servlet;

import com.edugestion.dao.BudgetDAO;
import com.edugestion.dao.DepartmentDAO;
import com.edugestion.model.Budget;
import com.edugestion.model.Department;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.Year;
import java.util.List;

@WebServlet("/BudgetServlet")
public class BudgetServlet extends HttpServlet {

    // GET → admin: todos los presupuestos; dept_manager: los de su departamento
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String role  = (String) session.getAttribute("role");
        int    idUser = (int) session.getAttribute("usuarioId");

        response.setContentType("application/json;charset=UTF-8");

        try {
            BudgetDAO      dao     = new BudgetDAO();
            DepartmentDAO  deptDao = new DepartmentDAO();

            List<Budget> budgets = "admin".equals(role)
                    ? dao.findAll()
                    : dao.findByUser(idUser);

            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < budgets.size(); i++) {
                Budget b = budgets.get(i);

                String deptName = "—";
                if (b.getCodeDept() != null) {
                    Department dept = deptDao.findById(b.getCodeDept());
                    if (dept != null) deptName = dept.getName();
                }

                json.append("{")
                    .append("\"idBudget\":").append(b.getIdBudget()).append(",")
                    .append("\"totalAmount\":").append(b.getTotalAmount()).append(",")
                    .append("\"year\":").append(b.getYear()).append(",")
                    .append("\"type\":").append(b.getType()).append(",")
                    .append("\"codeDept\":").append(b.getCodeDept()).append(",")
                    .append("\"deptName\":\"").append(esc(deptName)).append("\"")
                    .append("}");
                if (i < budgets.size() - 1) json.append(",");
            }
            json.append("]");
            response.getWriter().write(json.toString());

        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    // POST → crear nuevo presupuesto (solo admin)
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session == null || !"admin".equals(session.getAttribute("role"))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String codeDeptStr    = request.getParameter("codeDept");
        String totalAmountStr = request.getParameter("totalAmount");
        String typeStr        = request.getParameter("type");

        if (codeDeptStr == null || totalAmountStr == null || typeStr == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Faltan parámetros");
            return;
        }

        try {
            Budget b = new Budget();
            b.setCodeDept(Integer.parseInt(codeDeptStr));
            b.setTotalAmount(new BigDecimal(totalAmountStr));
            b.setType(Integer.parseInt(typeStr));
            b.setYear(Year.now().getValue());

            BudgetDAO dao   = new BudgetDAO();
            int newId       = dao.insert(b);
            b.setIdBudget(newId);

            DepartmentDAO deptDao = new DepartmentDAO();
            Department dept = deptDao.findById(b.getCodeDept());
            String deptName = dept != null ? dept.getName() : "—";

            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                "{\"idBudget\":" + newId +
                ",\"totalAmount\":" + b.getTotalAmount() +
                ",\"year\":"  + b.getYear() +
                ",\"type\":"  + b.getType() +
                ",\"codeDept\":" + b.getCodeDept() +
                ",\"deptName\":\"" + esc(deptName) + "\"}"
            );

        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Parámetros inválidos");
        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    // DELETE ?id=X → eliminar presupuesto (solo admin)
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
            boolean ok = new BudgetDAO().delete(Integer.parseInt(idParam));
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"ok\":" + ok + "}");
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
