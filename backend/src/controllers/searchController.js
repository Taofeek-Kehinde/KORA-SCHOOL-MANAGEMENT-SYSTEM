const { supabaseAdmin } = require('../config/supabase');

class SearchController {
  constructor() {
    this.searchStudents = this.searchStudents.bind(this);
    this.searchByName = this.searchByName.bind(this);
    this.searchByAdmissionNumber = this.searchByAdmissionNumber.bind(this);
    this.searchByStudentId = this.searchByStudentId.bind(this);
    this.searchByParentName = this.searchByParentName.bind(this);
    this.searchByParentPhone = this.searchByParentPhone.bind(this);
    this.searchByClass = this.searchByClass.bind(this);
    this.searchByHouse = this.searchByHouse.bind(this);
    this.searchByHostel = this.searchByHostel.bind(this);
    this.searchByBusRoute = this.searchByBusRoute.bind(this);
    this.searchByBarcode = this.searchByBarcode.bind(this);
    this.searchByQRCode = this.searchByQRCode.bind(this);
    this.searchCombined = this.searchCombined.bind(this);
  }

  // =============================================
  // SEARCH STUDENTS - COMPREHENSIVE
  // =============================================
  async searchStudents(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        query,
        searchBy = 'name', // name, admission_number, student_id, parent_name, parent_phone, class, house, hostel, bus_route, barcode, qr_code
        classId,
        limit = 50,
        offset = 0
      } = req.query;

      // If no query, return empty
      if (!query && !classId) {
        return res.status(200).json({
          status: 'success',
          data: [],
          pagination: { total: 0 }
        });
      }

      let results = [];

      switch (searchBy) {
        case 'name':
          results = await this.searchByName(schoolId, query, limit, offset);
          break;
        case 'admission_number':
          results = await this.searchByAdmissionNumber(schoolId, query, limit, offset);
          break;
        case 'student_id':
          results = await this.searchByStudentId(schoolId, query, limit, offset);
          break;
        case 'parent_name':
          results = await this.searchByParentName(schoolId, query, limit, offset);
          break;
        case 'parent_phone':
          results = await this.searchByParentPhone(schoolId, query, limit, offset);
          break;
        case 'class':
          results = await this.searchByClass(schoolId, classId || query, limit, offset);
          break;
        case 'house':
          results = await this.searchByHouse(schoolId, query, limit, offset);
          break;
        case 'hostel':
          results = await this.searchByHostel(schoolId, query, limit, offset);
          break;
        case 'bus_route':
          results = await this.searchByBusRoute(schoolId, query, limit, offset);
          break;
        case 'barcode':
          results = await this.searchByBarcode(schoolId, query, limit, offset);
          break;
        case 'qr_code':
          results = await this.searchByQRCode(schoolId, query, limit, offset);
          break;
        default:
          // Combined search - try all
          results = await this.searchCombined(schoolId, query, limit, offset);
      }

      res.status(200).json({
        status: 'success',
        data: results.data || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: results.total || 0
        }
      });
    } catch (error) {
      console.error('Search Students Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to search students',
        error: error.message
      });
    }
  }

  // =============================================
  // SEARCH BY NAME
  // =============================================
  async searchByName(schoolId, query, limit, offset) {
    try {
      const tokens = (query || '').trim().split(/\s+/).filter(Boolean);
      const nameSearchClause = tokens.length > 0
        ? tokens.map(token => `first_name.ilike.%${token}%,last_name.ilike.%${token}%,middle_name.ilike.%${token}%`).join(',')
        : `first_name.ilike.%${query || ''}%`;

      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .or(nameSearchClause)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By Name Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // SEARCH BY ADMISSION NUMBER
  // =============================================
  async searchByAdmissionNumber(schoolId, query, limit, offset) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .ilike('admission_number', `%${query}%`)
        .order('admission_number', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By Admission Number Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // SEARCH BY STUDENT ID
  // =============================================
  async searchByStudentId(schoolId, query, limit, offset) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .eq('id', query)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By Student ID Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // SEARCH BY PARENT NAME
  // =============================================
  async searchByParentName(schoolId, query, limit, offset) {
    try {
      // First find parent IDs
      const { data: parentData, error: parentError } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('school_id', schoolId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);

      if (parentError) throw parentError;

      const parentIds = parentData?.map(p => p.id) || [];

      if (parentIds.length === 0) {
        return { data: [], total: 0 };
      }

      // Then find students linked to those parents
      const { data: studentIds, error: linkError } = await supabaseAdmin
        .from('student_parents')
        .select('student_id')
        .in('parent_id', parentIds);

      if (linkError) throw linkError;

      const studentIdList = studentIds?.map(s => s.student_id) || [];

      if (studentIdList.length === 0) {
        return { data: [], total: 0 };
      }

      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .in('id', studentIdList)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By Parent Name Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // SEARCH BY PARENT PHONE
  // =============================================
  async searchByParentPhone(schoolId, query, limit, offset) {
    try {
      const { data: parentData, error: parentError } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('school_id', schoolId)
        .ilike('phone', `%${query}%`);

      if (parentError) throw parentError;

      const parentIds = parentData?.map(p => p.id) || [];

      if (parentIds.length === 0) {
        return { data: [], total: 0 };
      }

      const { data: studentIds, error: linkError } = await supabaseAdmin
        .from('student_parents')
        .select('student_id')
        .in('parent_id', parentIds);

      if (linkError) throw linkError;

      const studentIdList = studentIds?.map(s => s.student_id) || [];

      if (studentIdList.length === 0) {
        return { data: [], total: 0 };
      }

      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .in('id', studentIdList)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By Parent Phone Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // SEARCH BY CLASS
  // =============================================
  async searchByClass(schoolId, classId, limit, offset) {
    try {
      const rawValue = classId || '';
      const trimmed = String(rawValue).trim();

      if (!trimmed) {
        return { data: [], total: 0 };
      }

      let classFilterIds = [];

      if (trimmed.includes('-')) {
        classFilterIds = [trimmed];
      } else {
        const { data: classMatches, error: classError } = await supabaseAdmin
          .from('classes')
          .select('id')
          .eq('school_id', schoolId)
          .ilike('name', `%${trimmed}%`);

        if (classError) throw classError;
        classFilterIds = classMatches?.map(c => c.id) || [];
      }

      if (classFilterIds.length === 0) {
        return { data: [], total: 0 };
      }

      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .in('class_id', classFilterIds)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By Class Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // SEARCH BY HOUSE
  // =============================================
  async searchByHouse(schoolId, query, limit, offset) {
    try {
      const searchValue = (query || '').trim();
      if (!searchValue) return { data: [], total: 0 };

      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .ilike('house', `%${searchValue}%`)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By House Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // SEARCH BY HOSTEL
  // =============================================
  async searchByHostel(schoolId, query, limit, offset) {
    try {
      const searchValue = (query || '').trim();
      if (!searchValue) return { data: [], total: 0 };

      // First find hostels matching query
      const { data: hostelData } = await supabaseAdmin
        .from('hostels')
        .select('id')
        .eq('school_id', schoolId)
        .ilike('name', `%${searchValue}%`);

      const hostelIds = hostelData?.map(h => h.id) || [];

      if (hostelIds.length === 0) {
        return { data: [], total: 0 };
      }

      // Find students in those hostels
      const { data: assignments } = await supabaseAdmin
        .from('hostel_assignments')
        .select('student_id')
        .in('hostel_id', hostelIds);

      const studentIdList = assignments?.map(a => a.student_id) || [];

      if (studentIdList.length === 0) {
        return { data: [], total: 0 };
      }

      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .in('id', studentIdList)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By Hostel Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // SEARCH BY BUS ROUTE
  // =============================================
  async searchByBusRoute(schoolId, query, limit, offset) {
    try {
      const searchValue = (query || '').trim();
      if (!searchValue) return { data: [], total: 0 };

      const { data: routeData } = await supabaseAdmin
        .from('routes')
        .select('id')
        .eq('school_id', schoolId)
        .ilike('name', `%${searchValue}%`);

      const routeIds = routeData?.map(r => r.id) || [];

      if (routeIds.length === 0) {
        return { data: [], total: 0 };
      }

      const { data: assignments } = await supabaseAdmin
        .from('transport_assignments')
        .select('student_id')
        .in('route_id', routeIds);

      const studentIdList = assignments?.map(a => a.student_id) || [];

      if (studentIdList.length === 0) {
        return { data: [], total: 0 };
      }

      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .in('id', studentIdList)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By Bus Route Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // SEARCH BY BARCODE
  // =============================================
  async searchByBarcode(schoolId, query, limit, offset) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .eq('barcode', query)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By Barcode Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // SEARCH BY QR CODE
  // =============================================
  async searchByQRCode(schoolId, query, limit, offset) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .eq('qr_code', query)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Search By QR Code Error:', error);
      return { data: [], total: 0 };
    }
  }

  // =============================================
  // COMBINED SEARCH
  // =============================================
  async searchCombined(schoolId, query, limit, offset) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          campuses!campus_id(id, name),
          parents:student_parents(
            parents!parent_id(id, first_name, last_name, email, phone)
          )
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .or(`
          first_name.ilike.%${query}%,
          last_name.ilike.%${query}%,
          middle_name.ilike.%${query}%,
          admission_number.ilike.%${query}%,
          email.ilike.%${query}%,
          phone.ilike.%${query}%
        `)
        .order('last_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Combined Search Error:', error);
      return { data: [], total: 0 };
    }
  }
}

module.exports = new SearchController();