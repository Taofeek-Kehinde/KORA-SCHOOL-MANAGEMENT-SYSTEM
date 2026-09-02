const { supabaseAdmin } = require('../config/supabase');
const studentNotificationService = require('../services/studentNotificationService');
class PromotionController {
  // =============================================
  // GET PROMOTION DATA
  // =============================================
  getPromotionData = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { classId } = req.query;

      // Get class info
      const { data: classData } = await supabaseAdmin
        .from('classes')
        .select('*')
        .eq('id', classId)
        .eq('school_id', schoolId)
        .single();

      // Get all classes for dropdown
      const { data: classes } = await supabaseAdmin
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('level', { ascending: true });

      // Get students in the class
      const { data: students, error: studentError } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(id, name, level),
          grades(
            id, total, grade, remark,
            subject_id,
            subjects!subject_id(id, name, code)
          )
        `)
        .eq('school_id', schoolId)
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      if (studentError) throw studentError;

      // Calculate performance for each student
      const studentsWithPerformance = students.map(student => {
        const grades = student.grades || [];
        const totalScore = grades.reduce((sum, g) => sum + (g.total || 0), 0);
        const average = grades.length > 0 ? Math.round(totalScore / grades.length) : 0;
        
        // Get highest grade achieved
        const bestGrade = grades.reduce((best, g) => {
          if (!best || (g.total || 0) > best.total) return g;
          return best;
        }, null);

        return {
          ...student,
          average_score: average,
          grade_count: grades.length,
          best_grade: bestGrade?.grade || 'N/A'
        };
      });

      // Get next class
      const nextClass = this.getNextClass(classes, classData);

      res.status(200).json({
        status: 'success',
        data: {
          current_class: classData,
          next_class: nextClass,
          classes: classes,
          students: studentsWithPerformance
        }
      });
    } catch (error) {
      console.error('Get Promotion Data Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get promotion data',
        error: error.message
      });
    }
  };

  // =============================================
  // GET NEXT CLASS
  // =============================================
  getNextClass = (classes, currentClass) => {
    if (!currentClass || !classes) return null;

    // Sort by level
    const sortedClasses = [...classes].sort((a, b) => {
      const levelOrder = ['Nursery 1', 'Nursery 2', 'Nursery 3', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
      return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
    });

    const currentIndex = sortedClasses.findIndex(c => c.id === currentClass.id);
    
    if (currentIndex === -1 || currentIndex === sortedClasses.length - 1) {
      // No next class (either not found or last class)
      return null;
    }

    return sortedClasses[currentIndex + 1];
  };

  // =============================================
  // PROMOTE STUDENTS
  // =============================================
  promoteStudents = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const {
        fromClassId,
        toClassId,
        students,
        promoteType = 'all' // 'all' or 'selected'
      } = req.body;

      if (!fromClassId || !toClassId) {
        return res.status(400).json({
          status: 'error',
          message: 'From class and To class are required'
        });
      }

      if (!students || students.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No students to promote'
        });
      }

      const results = {
        promoted: [],
        repeated: [],
        failed: []
      };

      for (const student of students) {
        try {
          const { studentId, action = 'promote' } = student;

          if (action === 'repeat') {
            // Repeat student - stay in same class
            const { data: repeatedStudent, error: repeatError } = await supabaseAdmin
              .from('students')
              .update({
                student_status: 'repeating',
                updated_at: new Date()
              })
              .eq('id', studentId)
              .select()
              .single();

            if (repeatError) throw repeatError;

            // After students are promoted
for (const promotedStudent of results.promoted) {
  try {
    const { data: school } = await supabaseAdmin
      .from('schools')
      .select('name')
      .eq('id', schoolId)
      .single();

    const { data: fromClass } = await supabaseAdmin
      .from('classes')
      .select('name')
      .eq('id', fromClassId)
      .single();

    const { data: toClass } = await supabaseAdmin
      .from('classes')
      .select('name')
      .eq('id', toClassId)
      .single();

    await studentNotificationService.notifyStudentPromoted({
      schoolId,
      school,
      student: promotedStudent,
      fromClass: fromClass?.name || 'Previous Class',
      toClass: toClass?.name || 'New Class'
    });
  } catch (notifError) {
    console.error('Send promotion notification error:', notifError);
  }
}

            // Record promotion history
            await supabaseAdmin
              .from('promotion_history')
              .insert({
                student_id: studentId,
                from_class_id: fromClassId,
                to_class_id: fromClassId, // Same class for repeat
                promotion_type: 'repeat',
                reason: student.reason || 'Repeating class',
                promoted_by: adminId,
                created_at: new Date()
              });

            results.repeated.push(repeatedStudent);
          } else {
            // Promote student
            const { data: promotedStudent, error: promoteError } = await supabaseAdmin
              .from('students')
              .update({
                class_id: toClassId,
                student_status: 'active',
                updated_at: new Date()
              })
              .eq('id', studentId)
              .select()
              .single();

            if (promoteError) throw promoteError;

            // Record promotion history
            await supabaseAdmin
              .from('promotion_history')
              .insert({
                student_id: studentId,
                from_class_id: fromClassId,
                to_class_id: toClassId,
                promotion_type: 'promote',
                reason: student.reason || 'Promoted to next class',
                promoted_by: adminId,
                created_at: new Date()
              });

            results.promoted.push(promotedStudent);
          }
        } catch (error) {
          results.failed.push({
            student_id: student.studentId,
            error: error.message
          });
        }
      }

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'PROMOTE_STUDENTS',
          entity_type: 'students',
          new_values: {
            from_class_id: fromClassId,
            to_class_id: toClassId,
            promoted_count: results.promoted.length,
            repeated_count: results.repeated.length,
            failed_count: results.failed.length
          }
        });

      res.status(200).json({
        status: 'success',
        message: `Promoted ${results.promoted.length} students, repeated ${results.repeated.length} students`,
        data: {
          summary: {
            total: students.length,
            promoted: results.promoted.length,
            repeated: results.repeated.length,
            failed: results.failed.length
          },
          promoted: results.promoted,
          repeated: results.repeated,
          failed: results.failed
        }
      });
    } catch (error) {
      console.error('Promote Students Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to promote students',
        error: error.message
      });
    }
  };

  // =============================================
  // HOLD PROMOTION PENDING APPROVAL
  // =============================================
  holdPromotion = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { students, fromClassId, toClassId } = req.body;

      const results = {
        held: [],
        failed: []
      };

      for (const student of students) {
        try {
          const { data: heldStudent, error: holdError } = await supabaseAdmin
            .from('students')
            .update({
              student_status: 'pending_promotion',
              updated_at: new Date()
            })
            .eq('id', student.studentId)
            .select()
            .single();

          if (holdError) throw holdError;

          // Record promotion history
          await supabaseAdmin
            .from('promotion_history')
            .insert({
              student_id: student.studentId,
              from_class_id: fromClassId,
              to_class_id: toClassId,
              promotion_type: 'pending',
              reason: student.reason || 'Held pending approval',
              promoted_by: adminId,
              created_at: new Date()
            });

          results.held.push(heldStudent);
        } catch (error) {
          results.failed.push({
            student_id: student.studentId,
            error: error.message
          });
        }
      }

      res.status(200).json({
        status: 'success',
        message: `Held ${results.held.length} students pending approval`,
        data: {
          summary: {
            total: students.length,
            held: results.held.length,
            failed: results.failed.length
          },
          held: results.held,
          failed: results.failed
        }
      });
    } catch (error) {
      console.error('Hold Promotion Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to hold promotion',
        error: error.message
      });
    }
  };

  // =============================================
  // APPROVE PROMOTION
  // =============================================
  approvePromotion = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { promotionId, approve, reason } = req.body;

      // Get promotion history
      const { data: promotion, error: fetchError } = await supabaseAdmin
        .from('promotion_history')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (fetchError) throw fetchError;

      if (!approve) {
        // Reject promotion - student stays in current class
        await supabaseAdmin
          .from('students')
          .update({
            student_status: 'active',
            updated_at: new Date()
          })
          .eq('id', promotion.student_id);

        // Update promotion history
        await supabaseAdmin
          .from('promotion_history')
          .update({
            status: 'rejected',
            rejection_reason: reason || 'Rejected by admin',
            reviewed_by: adminId,
            reviewed_at: new Date()
          })
          .eq('id', promotionId);

        return res.status(200).json({
          status: 'success',
          message: 'Promotion rejected',
          data: { promotionId }
        });
      }

      // Approve promotion
      const { data: approvedStudent } = await supabaseAdmin
        .from('students')
        .update({
          class_id: promotion.to_class_id,
          student_status: 'active',
          updated_at: new Date()
        })
        .eq('id', promotion.student_id)
        .select()
        .single();

      // Update promotion history
      await supabaseAdmin
        .from('promotion_history')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date()
        })
        .eq('id', promotionId);

      res.status(200).json({
        status: 'success',
        message: 'Promotion approved',
        data: {
          promotionId,
          student: approvedStudent
        }
      });
    } catch (error) {
      console.error('Approve Promotion Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to approve promotion',
        error: error.message
      });
    }
  };

  // =============================================
  // GET PENDING PROMOTIONS
  // =============================================
  getPendingPromotions = async (req, res) => {
    try {
      const { schoolId } = req.params;

      const { data: promotions, error } = await supabaseAdmin
        .from('promotion_history')
        .select(`
          *,
          students!student_id(
            id, first_name, last_name, admission_number,
            classes!class_id(id, name)
          ),
          from_class:classes!from_class_id(id, name),
          to_class:classes!to_class_id(id, name)
        `)
        .eq('status', 'pending')
        .eq('students.school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((promotions || []).map(p => p.promoted_by).filter(Boolean))];
      let userMap = {};

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);

        if (usersError) throw usersError;

        userMap = (usersData || []).reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }

      const mappedPromotions = (promotions || []).map(promotion => ({
        ...promotion,
        user: userMap[promotion.promoted_by] || null
      }));

      res.status(200).json({
        status: 'success',
        data: mappedPromotions
      });
    } catch (error) {
      console.error('Get Pending Promotions Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get pending promotions',
        error: error.message
      });
    }
  };

  // =============================================
  // GENERATE PROMOTION REPORT
  // =============================================
  generatePromotionReport = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { sessionId, termId } = req.query;

      const { data: promotions, error } = await supabaseAdmin
        .from('promotion_history')
        .select(`
          *,
          students!student_id(
            id, first_name, last_name, admission_number,
            classes!class_id(id, name, level)
          ),
          from_class:classes!from_class_id(id, name),
          to_class:classes!to_class_id(id, name)
        `)
        .eq('students.school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((promotions || []).map(p => p.promoted_by).filter(Boolean))];
      let userMap = {};

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);

        if (usersError) throw usersError;

        userMap = (usersData || []).reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }

      const mappedPromotions = (promotions || []).map(promotion => ({
        ...promotion,
        user: userMap[promotion.promoted_by] || null
      }));

      // Calculate summary
      const summary = {
        total: mappedPromotions.length,
        promoted: mappedPromotions.filter(p => p.promotion_type === 'promote' && p.status === 'approved').length,
        repeated: mappedPromotions.filter(p => p.promotion_type === 'repeat').length,
        pending: mappedPromotions.filter(p => p.status === 'pending').length,
        rejected: mappedPromotions.filter(p => p.status === 'rejected').length
      };

      res.status(200).json({
        status: 'success',
        data: {
          summary,
          promotions: mappedPromotions
        }
      });
    } catch (error) {
      console.error('Generate Promotion Report Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate promotion report',
        error: error.message
      });
    }
  };
}

module.exports = new PromotionController();