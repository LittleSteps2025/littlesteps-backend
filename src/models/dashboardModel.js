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
   * Get count of pending complaints
   */
  async getPendingComplaints() {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM complaints 
        WHERE LOWER(status) = 'pending'
      `;
      const { rows } = await pool.query(query);
      console.log('📊 Pending complaints query result:', rows[0]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('❌ Error in getPendingComplaints:', error);
      return 0;
    }
  }

  /**
   * Get total count of all complaints
   */
  async getTotalComplaints() {
    try {
      const query = 'SELECT COUNT(*) as count FROM complaints';
      const { rows } = await pool.query(query);
      console.log('📊 Total complaints query result:', rows[0]);
      return parseInt(rows[0].count) || 0;
    } catch (error) {
      console.error('❌ Error in getTotalComplaints:', error);
      return 0;
    }
  }

  /**
   * Get today's check-ins count (can be customized based on attendance table if exists)
   * For now, returns total children as assumption
   */
  async getTodayCheckIns() {
    try {
      // If you have an attendance table with today's records:
      // const query = `
      //   SELECT COUNT(*) as count 
      //   FROM attendance 
      //   WHERE DATE(check_in_time) = CURRENT_DATE AND status = 'present'
      // `;
      
      // For now, return total children
      return await this.getTotalChildren();
    } catch (error) {
      console.error('❌ Error in getTodayCheckIns:', error);
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
}

export default new DashboardModel();
