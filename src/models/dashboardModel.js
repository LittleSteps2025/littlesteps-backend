import pool from '../config/db.js';

class DashboardModel {
  /**
   * Get total count of children from child table
   */
  async getTotalChildren() {
    try {
      const query = 'SELECT COUNT(*) as count FROM child';
      const { rows } = await pool.query(query);
      console.log('📊 Total children query result:', rows[0]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('❌ Error in getTotalChildren:', error);
      return 0;
    }
  }

  /**
   * Get count of unique parents from child table
   */
  async getActiveParents() {
    try {
      const query = 'SELECT COUNT(DISTINCT parent_id) as count FROM child';
      const { rows } = await pool.query(query);
      console.log('📊 Active parents query result:', rows[0]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('❌ Error in getActiveParents:', error);
      return 0;
    }
  }

  /**
   * Get count of active teachers from user and teacher tables
   */
  async getActiveTeachers() {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM "user" u
        INNER JOIN teacher t ON u.user_id = t.user_id
        WHERE u.role = 'teacher' AND u.status = 'active'
      `;
      const { rows } = await pool.query(query);
      console.log('📊 Active teachers query result:', rows[0]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('❌ Error in getActiveTeachers:', error);
      return 0;
    }
  }

  /**
   * Get count of supervisors from user and supervisor tables
   */
  async getActiveSupervisors() {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM "user" u
        INNER JOIN supervisor s ON u.user_id = s.user_id
        WHERE u.role = 'supervisor' AND u.status = 'active'
      `;
      const { rows } = await pool.query(query);
      console.log('📊 Active supervisors query result:', rows[0]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('❌ Error in getActiveSupervisors:', error);
      return 0;
    }
  }

  /**
   * Get upcoming events (next N events from today)
   */
  async getUpcomingEvents(limit = 4) {
    try {
      const query = `
        SELECT 
          event_id,
          user_id,
          image,
          date,
          time,
          description,
          topic,
          venue
        FROM event
        WHERE date >= CURRENT_DATE
        ORDER BY date ASC, time ASC
        LIMIT $1
      `;
      const { rows } = await pool.query(query, [limit]);
      console.log(`📊 Upcoming events query result (${rows.length} events):`, rows);
      return rows;
    } catch (error) {
      console.error('❌ Error in getUpcomingEvents:', error);
      return [];
    }
  }

  /**
   * Get count of all upcoming events
   */
  async getTotalEvents() {
    try {
      const query = 'SELECT COUNT(*) as count FROM event WHERE date >= CURRENT_DATE';
      const { rows } = await pool.query(query);
      console.log('📊 Total upcoming events query result:', rows[0]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('❌ Error in getTotalEvents:', error);
      return 0;
    }
  }

  /**
   * Get count of pending complaints (supervisor complaints only)
   */
  async getPendingComplaints() {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM complaints 
        WHERE LOWER(status) = 'pending' 
        AND LOWER(TRIM(recipient)) = 'supervisor'
      `;
      const { rows } = await pool.query(query);
      console.log('📊 Pending supervisor complaints query result:', rows[0]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('❌ Error in getPendingComplaints:', error);
      return 0;
    }
  }

  /**
   * Get total count of all complaints (supervisor complaints only)
   */
  async getTotalComplaints() {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM complaints 
        WHERE LOWER(TRIM(recipient)) = 'supervisor'
      `;
      const { rows } = await pool.query(query);
      console.log('📊 Total supervisor complaints query result:', rows[0]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('❌ Error in getTotalComplaints:', error);
      return 0;
    }
  }

  /**
   * Get today's check-ins count from report table
   */
  async getTodayCheckIns() {
    try {
      const query = `
        SELECT COUNT(DISTINCT child_id) as count 
        FROM report 
        WHERE DATE(arrived_time) = CURRENT_DATE
      `;
      const { rows } = await pool.query(query);
      console.log('📊 Today check-ins query result:', rows[0]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('❌ Error in getTodayCheckIns:', error);
      return 0;
    }
  }

  /**
   * Get revenue for a specific period
   */
  async getRevenue(period = 'month', feePerChild = 5500) {
    try {
      let dateFilter = '';
      
      switch (period) {
        case 'today':
          dateFilter = "DATE(c.created_at) = CURRENT_DATE";
          break;
        case 'week':
          dateFilter = "c.created_at >= DATE_TRUNC('week', CURRENT_DATE)";
          break;
        case 'month':
          dateFilter = "c.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
          break;
        default:
          dateFilter = "c.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
      }
      
      const query = `
        SELECT COUNT(DISTINCT c.child_id) as count
        FROM child c
        WHERE ${dateFilter}
      `;
      
      const { rows } = await pool.query(query);
      const childCount = parseInt(rows[0].count) || 0;
      const revenue = childCount * feePerChild;
      
      console.log(`📊 Revenue for ${period}: ${childCount} children × Rs.${feePerChild} = Rs.${revenue}`);
      return revenue;
    } catch (error) {
      console.error('❌ Error in getRevenue:', error);
      return 0;
    }
  }

  /**
   * Get monthly revenue calculation
   * Based on active parents * subscription fee
   */
  async getMonthlyRevenue(feePerParent = 5500) {
    try {
      const activeParents = await this.getActiveParents();
      const revenue = activeParents * feePerParent;
      console.log(`📊 Monthly revenue: ${activeParents} parents × Rs.${feePerParent} = Rs.${revenue}`);
      return revenue;
    } catch (error) {
      console.error('❌ Error in getMonthlyRevenue:', error);
      return 0;
    }
  }

  /**
   * Get count of children by age group
   */
  async getChildrenByAgeGroup() {
    try {
      const query = `
        SELECT 
          CASE 
            WHEN age <= 2 THEN 'Infants (0-2)'
            WHEN age <= 4 THEN 'Toddlers (3-4)'
            WHEN age <= 6 THEN 'Preschool (5-6)'
            ELSE 'School Age (7+)'
          END as age_group,
          COUNT(*) as count
        FROM child
        GROUP BY age_group
        ORDER BY age_group
      `;
      const { rows } = await pool.query(query);
      console.log('📊 Children by age group query result:', rows);
      return rows;
    } catch (error) {
      console.error('❌ Error in getChildrenByAgeGroup:', error);
      return [];
    }
  }

  /**
   * Get count of children by group/class
   */
  async getChildrenByGroup() {
    try {
      const query = `
        SELECT 
          g.name as group_name,
          g.group_id,
          COUNT(c.child_id) as child_count
        FROM "group" g
        LEFT JOIN child c ON g.group_id = c.group_id
        GROUP BY g.group_id, g.name
        ORDER BY g.name
      `;
      const { rows } = await pool.query(query);
      console.log('📊 Children by group query result:', rows);
      return rows;
    } catch (error) {
      console.error('❌ Error in getChildrenByGroup:', error);
      return [];
    }
  }

  /**
   * Get all dashboard statistics in one call
   */
  async getAllDashboardStats() {
    try {
      console.log('🔄 Starting to fetch all dashboard statistics...');
      
      const [
        totalChildren,
        activeParents,
        activeTeachers,
        activeSupervisors,
        todayCheckIns,
        monthlyRevenue,
        upcomingEventsCount,
        pendingComplaints,
        totalComplaints,
        upcomingEvents,
        childrenByAgeGroup,
        childrenByGroup
      ] = await Promise.all([
        this.getTotalChildren(),
        this.getActiveParents(),
        this.getActiveTeachers(),
        this.getActiveSupervisors(),
        this.getTodayCheckIns(),
        this.getMonthlyRevenue(),
        this.getTotalEvents(),
        this.getPendingComplaints(),
        this.getTotalComplaints(),
        this.getUpcomingEvents(),
        this.getChildrenByAgeGroup(),
        this.getChildrenByGroup()
      ]);

      const result = {
        overview: {
          totalChildren,
          activeParents,
          activeTeachers,
          activeSupervisors,
          todayCheckIns,
          monthlyRevenue,
          upcomingEvents: upcomingEventsCount,
          pendingComplaints,
          totalComplaints
        },
        events: upcomingEvents,
        demographics: {
          byAgeGroup: childrenByAgeGroup,
          byGroup: childrenByGroup
        }
      };

      console.log('✅ All dashboard stats fetched successfully!');
      console.log('📊 Overview:', result.overview);
      
      return result;
    } catch (error) {
      console.error('❌ Error in getAllDashboardStats:', error);
      throw error;
    }
  }

  /**
   * Get stats for a specific period (today, week, month)
   */
  async getStatsByPeriod(period = 'today') {
    try {
      console.log(`🔄 Fetching stats for period: ${period}`);
      
      let dateFilter = '';
      let checkInDateFilter = '';
      
      switch (period) {
        case 'today':
          dateFilter = "DATE(c.created_at) = CURRENT_DATE";
          checkInDateFilter = "DATE(r.arrived_time) = CURRENT_DATE";
          break;
        case 'week':
          dateFilter = "c.created_at >= DATE_TRUNC('week', CURRENT_DATE)";
          checkInDateFilter = "r.arrived_time >= DATE_TRUNC('week', CURRENT_DATE)";
          break;
        case 'month':
          dateFilter = "c.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
          checkInDateFilter = "r.arrived_time >= DATE_TRUNC('month', CURRENT_DATE)";
          break;
        default:
          dateFilter = "DATE(c.created_at) = CURRENT_DATE";
          checkInDateFilter = "DATE(r.arrived_time) = CURRENT_DATE";
      }
      
      // Total children for period
      const childrenQuery = `SELECT COUNT(*) as count FROM child c WHERE ${dateFilter}`;
      const { rows: childrenRows } = await pool.query(childrenQuery);
      
      // Check-ins for period
      const checkInsQuery = `
        SELECT COUNT(DISTINCT child_id) as count 
        FROM report r 
        WHERE ${checkInDateFilter}
      `;
      const { rows: checkInsRows } = await pool.query(checkInsQuery);
      
      // Revenue for period
      const revenue = await this.getRevenue(period);
      
      return {
        totalChildren: parseInt(childrenRows[0].count) || 0,
        checkIns: parseInt(checkInsRows[0].count) || 0,
        revenue
      };
    } catch (error) {
      console.error(`❌ Error in getStatsByPeriod(${period}):`, error);
      return {
        totalChildren: 0,
        checkIns: 0,
        revenue: 0
      };
    }
  }

  /**
   * Get weekly revenue data for graph (7 days)
   */
  async getWeeklyRevenueData(feePerChild = 5500) {
    try {
      const query = `
        SELECT 
          TO_CHAR(date_series, 'Day') as day_name,
          EXTRACT(DOW FROM date_series) as day_num,
          COUNT(DISTINCT c.child_id) as child_count,
          COUNT(DISTINCT c.child_id) * $1 as revenue
        FROM generate_series(
          DATE_TRUNC('week', CURRENT_DATE),
          DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days',
          INTERVAL '1 day'
        ) as date_series
        LEFT JOIN child c ON DATE(c.created_at) = DATE(date_series)
        GROUP BY date_series, day_num
        ORDER BY day_num
      `;
      
      const { rows } = await pool.query(query, [feePerChild]);
      console.log('📊 Weekly revenue data:', rows);
      return rows;
    } catch (error) {
      console.error('❌ Error in getWeeklyRevenueData:', error);
      return [];
    }
  }

  /**
   * Get monthly revenue data for graph (last 30 days)
   */
  async getMonthlyRevenueData(feePerChild = 5500) {
    try {
      const query = `
        SELECT 
          TO_CHAR(date_series, 'Mon DD') as date_label,
          COUNT(DISTINCT c.child_id) as child_count,
          COUNT(DISTINCT c.child_id) * $1 as revenue
        FROM generate_series(
          DATE_TRUNC('month', CURRENT_DATE),
          CURRENT_DATE,
          INTERVAL '1 day'
        ) as date_series
        LEFT JOIN child c ON DATE(c.created_at) = DATE(date_series)
        GROUP BY date_series
        ORDER BY date_series
      `;
      
      const { rows } = await pool.query(query, [feePerChild]);
      console.log('📊 Monthly revenue data:', rows);
      return rows;
    } catch (error) {
      console.error('❌ Error in getMonthlyRevenueData:', error);
      return [];
    }
  }

  /**
   * Get weekly attendance data for graph
   */
  async getWeeklyAttendanceData() {
    try {
      const query = `
        SELECT 
          TO_CHAR(date_series, 'Day') as day_name,
          EXTRACT(DOW FROM date_series) as day_num,
          COUNT(DISTINCT r.child_id) as check_ins
        FROM generate_series(
          DATE_TRUNC('week', CURRENT_DATE),
          DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days',
          INTERVAL '1 day'
        ) as date_series
        LEFT JOIN report r ON DATE(r.arrived_time) = DATE(date_series)
        GROUP BY date_series, day_num
        ORDER BY day_num
      `;
      
      const { rows } = await pool.query(query);
      console.log('📊 Weekly attendance data:', rows);
      return rows;
    } catch (error) {
      console.error('❌ Error in getWeeklyAttendanceData:', error);
      return [];
    }
  }

  /**
   * Get monthly attendance data for graph
   */
  async getMonthlyAttendanceData() {
    try {
      const query = `
        SELECT 
          TO_CHAR(date_series, 'Mon DD') as date_label,
          COUNT(DISTINCT r.child_id) as check_ins
        FROM generate_series(
          DATE_TRUNC('month', CURRENT_DATE),
          CURRENT_DATE,
          INTERVAL '1 day'
        ) as date_series
        LEFT JOIN report r ON DATE(r.arrived_time) = DATE(date_series)
        GROUP BY date_series
        ORDER BY date_series
      `;
      
      const { rows } = await pool.query(query);
      console.log('📊 Monthly attendance data:', rows);
      return rows;
    } catch (error) {
      console.error('❌ Error in getMonthlyAttendanceData:', error);
      return [];
    }
  }

  /**
   * Get weekly complaints data for graph (supervisor complaints only)
   */
  async getWeeklyComplaintsData() {
    try {
      // Debug: Show all supervisor complaints with their dates
      const debugAllQuery = `
        SELECT 
          complaint_id,
          date,
          recipient,
          status
        FROM complaints
        WHERE LOWER(TRIM(recipient)) = 'supervisor'
        ORDER BY date DESC
      `;
      const allComplaints = await pool.query(debugAllQuery);
      console.log('🔍 DEBUG: All supervisor complaints in database:', allComplaints.rows.length, 'total');
      console.log('🔍 DEBUG: Sample complaints:', allComplaints.rows.slice(0, 5));
      
      // Debug: Show complaints for current week
      const debugWeekQuery = `
        SELECT 
          complaint_id,
          date,
          recipient,
          status,
          TO_CHAR(date::date, 'YYYY-MM-DD') as formatted_date,
          EXTRACT(DOW FROM date::date) as day_of_week,
          TO_CHAR(date::date, 'Day') as day_name
        FROM complaints
        WHERE LOWER(TRIM(recipient)) = 'supervisor'
          AND date::date >= DATE_TRUNC('week', CURRENT_DATE)::date
          AND date::date <= (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date
        ORDER BY date
      `;
      const weekComplaints = await pool.query(debugWeekQuery);
      console.log('🔍 DEBUG: Supervisor complaints this week:', weekComplaints.rows.length, 'total');
      console.log('🔍 DEBUG: This week complaints details:', weekComplaints.rows);
      
      // Main aggregation query
      const query = `
        SELECT 
          TO_CHAR(date_series, 'Day') as day_name,
          EXTRACT(DOW FROM date_series) as day_num,
          date_series::date as series_date,
          COUNT(c.complaint_id) as complaint_count,
          COUNT(CASE WHEN LOWER(c.status) = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN LOWER(c.status) = 'resolved' THEN 1 END) as resolved_count
        FROM generate_series(
          DATE_TRUNC('week', CURRENT_DATE)::date,
          (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date,
          INTERVAL '1 day'
        ) as date_series
        LEFT JOIN complaints c ON 
          c.date::date = date_series::date
          AND LOWER(TRIM(c.recipient)) = 'supervisor'
        GROUP BY date_series, day_num
        ORDER BY day_num
      `;
      
      const { rows } = await pool.query(query);
      console.log('📊 Weekly complaints aggregated by day:', JSON.stringify(rows, null, 2));
      
      const totalFromAgg = rows.reduce((sum, row) => sum + parseInt(row.complaint_count || 0), 0);
      console.log('📊 Total from aggregation:', totalFromAgg);
      
      return rows;
    } catch (error) {
      console.error('❌ Error in getWeeklyComplaintsData:', error);
      console.error('Error details:', error.stack);
      return [];
    }
  }

  /**
   * Get monthly complaints data for graph (supervisor complaints only)
   */
  async getMonthlyComplaintsData() {
    try {
      const query = `
        SELECT 
          TO_CHAR(date_series, 'Mon DD') as date_label,
          date_series::date as series_date,
          COUNT(c.complaint_id) as complaint_count,
          COUNT(CASE WHEN LOWER(c.status) = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN LOWER(c.status) = 'resolved' THEN 1 END) as resolved_count
        FROM generate_series(
          DATE_TRUNC('month', CURRENT_DATE)::date,
          CURRENT_DATE::date,
          INTERVAL '1 day'
        ) as date_series
        LEFT JOIN complaints c ON 
          c.date::date = date_series::date
          AND LOWER(TRIM(c.recipient)) = 'supervisor'
        GROUP BY date_series
        ORDER BY date_series
      `;
      
      const { rows } = await pool.query(query);
      console.log('📊 Monthly supervisor complaints data:', rows.length, 'days');
      
      const totalFromAgg = rows.reduce((sum, row) => sum + parseInt(row.complaint_count || 0), 0);
      console.log('📊 Total complaints this month:', totalFromAgg);
      
      return rows;
    } catch (error) {
      console.error('❌ Error in getMonthlyComplaintsData:', error);
      return [];
    }
  }

  /**
   * Get chart data based on period
   */
  async getChartData(period = 'week') {
    try {
      console.log(`📊 Fetching chart data for period: ${period}`);
      
      const [revenueData, attendanceData, complaintsData] = await Promise.all([
        period === 'week' ? this.getWeeklyRevenueData() : this.getMonthlyRevenueData(),
        period === 'week' ? this.getWeeklyAttendanceData() : this.getMonthlyAttendanceData(),
        period === 'week' ? this.getWeeklyComplaintsData() : this.getMonthlyComplaintsData()
      ]);

      return {
        revenue: revenueData,
        attendance: attendanceData,
        complaints: complaintsData
      };
    } catch (error) {
      console.error('❌ Error in getChartData:', error);
      return {
        revenue: [],
        attendance: [],
        complaints: []
      };
    }
  }
}

export default new DashboardModel();
