import { inviteUser, acceptInvite, listUsers, deactivateUser } from "./user.service.js";
import { inviteSchema, acceptInviteSchema } from "./user.schemas.js";

const inviteUserController = async (req, res, next) => {
  try {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }

    const companyId = req.user.companyId;
    const { user, inviteLink, reinvited } = await inviteUser(companyId, parsed.data.email);

    // Always logged server-side — this is the only place the token is
    // durably recorded while there's no email service (PRD §7.2). Log
    // before responding, not after, so nothing is lost if the response
    // write itself somehow fails.
    console.log(`[invite] ${user.email}: ${inviteLink}`);

    res.status(201).json({
      success: true,
      message: reinvited ? "Invite resent" : "Invite sent",
      data: {
        user,
        // Only surfaced outside production, per PRD §4.6.
        ...(process.env.NODE_ENV !== "production" ? { inviteLink } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

const acceptInviteController = async (req, res, next) => {
  try {
    const parsed = acceptInviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }

    const result = await acceptInvite(parsed.data);

    res.status(200).json({
      success: true,
      message: "Account activated successfully",
      data: {
        token: result.token,
        user: result.user,
        company: {
          id: result.company.id,
          name: result.company.name,
          state: result.company.state,
          gstin: result.company.gstin,
          address: result.company.address,
          phone: result.company.phone,
          logo: result.company.logo,
          signature: result.company.signature,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const listUsersController = async (req, res, next) => {
  try {
    const users = await listUsers(req.user.companyId);
    res.status(200).json({ success: true, message: "Users fetched successfully", data: users });
  } catch (error) {
    next(error);
  }
};

const deactivateUserController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await deactivateUser(req.user.companyId, req.user.userId, id);
    res.status(200).json({ success: true, message: "User deactivated", data: user });
  } catch (error) {
    next(error);
  }
};

export { inviteUserController, acceptInviteController, listUsersController, deactivateUserController };