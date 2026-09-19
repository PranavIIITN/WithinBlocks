import { runAgent, previewAgentAction, confirmAgentAction } from "./agent.service.js";
import { confirmSchema } from "./agent.schemas.js";

// companyId and userId ALWAYS come from the verified JWT — never from the body.
const contextFrom = (req) => ({
  companyId: req.user.companyId,
  userId: req.user.userId,
});

const runAgentController = async (req, res, next) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }
    if (message.length > 500) {
      return res.status(400).json({ success: false, message: "Message is too long" });
    }

    const result = await runAgent(contextFrom(req), message.trim(), context || {});
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const previewAgentController = async (req, res, next) => {
  try {
    const parsed = confirmSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid preview payload" });
    }

    const result = await previewAgentAction(contextFrom(req), parsed.data.action, parsed.data.data);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const confirmAgentController = async (req, res, next) => {
  try {
    const parsed = confirmSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid confirmation payload" });
    }

    const result = await confirmAgentAction(contextFrom(req), parsed.data.action, parsed.data.data);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export { runAgentController, previewAgentController, confirmAgentController };