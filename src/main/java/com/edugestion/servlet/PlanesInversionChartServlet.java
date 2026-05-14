package com.edugestion.servlet;

import com.edugestion.dao.BudgetDAO;
import com.edugestion.dao.UserDAO;
import com.edugestion.model.Budget;
import com.edugestion.model.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.Year;

@WebServlet("/PlanesInversionChartServlet")
public class PlanesInversionChartServlet extends HttpServlet {

    // GET → { "total": X, "restante": Y } del plan de inversión (type=2)
    //       del departamento del usuario en sesión para el año actual
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
            User user = new UserDAO().findById(idUser);
            if (user == null || user.getCodeDept() == null) {
                response.getWriter().write("{\"total\":0,\"restante\":0}");
                return;
            }

            int codeDept    = user.getCodeDept();
            int currentYear = Year.now().getValue();
            BudgetDAO dao   = new BudgetDAO();

            Budget budget = dao.findByDeptAndType(codeDept, 2, currentYear);
            if (budget == null) {
                response.getWriter().write("{\"total\":0,\"restante\":0}");
                return;
            }

            BigDecimal total    = budget.getTotalAmount();
            BigDecimal gastado  = dao.getSpentAmount(budget.getIdBudget());
            BigDecimal restante = total.subtract(gastado);

            response.getWriter().write(
                "{\"total\":" + total + ",\"restante\":" + restante + "}"
            );

        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
