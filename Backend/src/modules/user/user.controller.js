import { inviteUser, acceptInvite, listUsers, deactivateUser } from "./user.service.js";
import { inviteSchema, acceptInviteSchema } from "./user.schemas.js";
import { sendInviteEmail } from "../email/email.service.js";

const inviteUserController = async (req, res, next) => {
  try {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
    }

    const companyId = req.user.companyId;
    const { user, inviteLink, reinvited, companyName } = await inviteUser(companyId, parsed.data.email);

    // Always logged server-side, regardless of email outcome — kept as the
    // fallback record in case a send silently fails without throwing
    // (shouldn't happen, but costs nothing to keep).
    console.log(`[invite] ${user.email}: ${inviteLink}`);

    let emailSent = true;
    let emailError = null;
    try {
      await sendInviteEmail({ to: user.email, companyName, inviteLink });
    } catch (err) {
      // The invite (and its token) already exist in the database — a
      // failed send shouldn't fail the whole request, just be surfaced so
      // the owner knows to deliver the link another way instead of
      // assuming it went out.
      emailSent = false;
      emailError = err.message;
      console.error(`[invite] email send failed for ${user.email}:`, err.message);
    }

    res.status(201).json({
      success: true,
      message: reinvited
        ? emailSent ? "Invite resent" : "Invite regenerated, but the email could not be sent"
        : emailSent ? "Invite sent" : "Invite created, but the email could not be sent",
      data: {
        user,
        emailSent,
        // Shown whenever it's actually needed: always in dev, and in
        // production ONLY when the email failed to send — otherwise a
        // failed send would leave the owner with an invite nobody can act
        // on and no way to retrieve the link, worse than the exposure
        // PRD §4.6 was originally guarding against.
        ...(process.env.NODE_ENV !== "production" || !emailSent ? { inviteLink } : {}),
        ...(emailError ? { emailError } : {}),
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