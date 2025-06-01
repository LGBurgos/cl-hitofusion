# -*- coding: utf-8 -*-
from odoo import api, fields, models


class MailActivity(models.Model):
    _inherit = 'mail.activity'

    activity_conversation_id = fields.Many2one('acrux.chat.conversation', string='Chat', store=False, readonly=True,
                                               compute='_compute_activity_conversation_id', ondelete='cascade')

    @api.depends('res_model', 'res_id')
    def _compute_activity_conversation_id(self):
        for rec in self:
            if rec.res_model == 'acrux.chat.conversation' and rec.res_id:
                rec.activity_conversation_id = rec.res_id
            else:
                rec.activity_conversation_id = False

    @api.model
    def _default_activity_type_for_model(self, model):
        if model == 'acrux.chat.conversation':
            chatroom_id = self.env['ir.model.data']._xmlid_to_res_id('whatsapp_connector.chatroom_activity_type',
                                                                     raise_if_not_found=False)
            activity_type = self.env['mail.activity.type'].browse(chatroom_id) \
                if chatroom_id else self.env['mail.activity.type']
            if activity_type and activity_type.active:
                return activity_type
            activity_type_model = self.env['mail.activity.type'].search([('res_model', '=', model)], limit=1)
            if activity_type_model:
                return activity_type_model
        return super()._default_activity_type_for_model(model)
