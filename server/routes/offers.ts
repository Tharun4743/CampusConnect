import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { db, createSupabaseClient } from "../lib/postgresql.js";

const router = Router();

// @POST /api/offers (HR only)
// Create a new offer for a student
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    
    if (user.role !== "hr") {
      return res.status(403).json({
        success: false,
        message: "Only HR can create offers"
      });
    }
    
    const {
      student_id,
      job_id,
      company_name,
      job_title,
      salary_package,
      offer_letter_url,
      expires_at
    } = req.body;
    
    if (!student_id || !job_id || !company_name || !job_title || !salary_package) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: student_id, job_id, company_name, job_title, salary_package"
      });
    }
    
    const newOffer = await db.createOffer({
      student_id,
      job_id,
      hr_id: user.userId,
      company_name,
      job_title,
      salary_package,
      offer_letter_url: offer_letter_url || "",
      status: "pending",
      expires_at: expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    res.status(201).json({
      success: true,
      data: newOffer,
      message: "Offer created successfully"
    });
  } catch (err: any) {
    console.error("Error creating offer:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create offer"
    });
  }
});

// @GET /api/offers/hr
// Get all offers created by the logged-in HR
router.get("/hr", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== "hr") {
      return res.status(403).json({ success: false, message: "Only HR can view their offers." });
    }
    const offers = await db.getOffersByHr(user.userId);
    res.json({ success: true, data: offers, message: "HR offers retrieved." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to retrieve offers" });
  }
});

// @GET /api/offers
// Get all offers for the logged-in student
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const supabase = await createSupabaseClient();
    const offers = await db.getOffersByStudent(userId);
    
    // Enrich offers with job and company details
    const enriched = await Promise.all(offers.map(async (offer: any) => {
      try {
        const job = await db.getJobById(offer.job_id);
        const { data: company } = job ? await supabase.from('companies').select('id, name, logo_url').eq('id', job.company_id).single() : { data: null };
        
        return {
          ...offer,
          job_title: job?.title || '',
          job_role: job?.role || '',
          company_name: company?.name || '',
          company_logo: company?.logo_url || ''
        };
      } catch (err) {
        console.warn(`Failed to enrich offer ${offer.id}:`, err);
        return offer;
      }
    }));
    
    res.json({
      success: true,
      data: enriched,
      message: "Offers retrieved successfully"
    });
  } catch (err: any) {
    console.error("Error fetching offers:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve offers"
    });
  }
});

// @GET /api/offers/:offerId
// Get a specific offer
router.get("/:offerId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { offerId } = req.params;
    const offer = await db.getOfferById(offerId);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found"
      });
    }

    const userId = req.user!.userId;
    if (offer.student_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    res.json({
      success: true,
      data: offer,
      message: "Offer retrieved successfully"
    });
  } catch (err: any) {
    console.error("Error fetching offer:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve offer"
    });
  }
});

// @POST /api/offers/:offerId/accept
// Accept an offer
router.post("/:offerId/accept", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { offerId } = req.params;
    const userId = req.user!.userId;
    
    const offer = await db.getOfferById(offerId);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found"
      });
    }
    
    if (offer.student_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to accept this offer"
      });
    }
    
    if (offer.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot accept offer with status: ${offer.status}`
      });
    }
    
    await db.updateOfferStatus(offerId, "accepted");
    
    // Create placement record when offer is accepted
    const student = await db.getStudentDetails(userId);
    if (student) {
      await db.updateStudentDetails(userId, {
        placement_status: "placed",
        placed_company: offer.company_name,
        placed_role: offer.role,
        placed_package: parseFloat(String(offer.package ?? offer.salary_package).replace(/[^0-9.]/g, ""))
      });
    }
    
    res.json({
      success: true,
      message: "Offer accepted successfully"
    });
  } catch (err: any) {
    console.error("Error accepting offer:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to accept offer"
    });
  }
});

// @POST /api/offers/:offerId/reject
// Reject an offer
router.post("/:offerId/reject", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { offerId } = req.params;
    const userId = req.user!.userId;
    
    const offer = await db.getOfferById(offerId);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found"
      });
    }
    
    if (offer.student_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to reject this offer"
      });
    }
    
    if (offer.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject offer with status: ${offer.status}`
      });
    }
    
    await db.updateOfferStatus(offerId, "rejected");
    
    res.json({
      success: true,
      message: "Offer rejected successfully"
    });
  } catch (err: any) {
    console.error("Error rejecting offer:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to reject offer"
    });
  }
});

export default router;



