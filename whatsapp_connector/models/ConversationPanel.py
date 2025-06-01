# -*- coding: utf-8 -*-
from odoo import models, fields, api, _


class ConversationPanel(models.Model):
    _name = 'acrux.chat.panel'
    _description = 'Chat Panel'

    name = fields.Char('Name', compute='_compute_name')
    activity_ids = fields.Many2many('mail.activity', 'chat_panel_activity_rel',
                                    'panel_id', 'activity_id', string='Activities',
                                    context={'filter_user': 'all'},
                                    compute='_compute_activities', store=False)
    all_activity_ids = fields.Many2many('mail.activity', 'chat_panel_all_activity_rel',
                                        'panel_id', 'activity_id', string='All Activities',
                                        compute='_compute_activities', store=False)
    details = fields.Html(compute='_compute_activities')
    company_id = fields.Many2one('res.company', default=lambda self: self.env.company)
    user_id = fields.Many2one(
        'res.users', 'Assigned to',
        default=lambda self: self.env.user,
        domain="[('company_id', 'in', [company_id, False]), ('is_chatroom_group','=',True)]",
        required=True, ondelete='cascade')
    activity_ids_count = fields.Integer(compute='_compute_activities', string='Activities Count')

    def _compute_name(self):
        for rec in self:
            dt = fields.Datetime
            date = dt.to_string(dt.context_timestamp(self, dt.now()))
            rec.name = _('Activities: %s') % date

    @api.depends('user_id')
    def _compute_activities(self):
        for rec in self:
            activity_ids = rec.get_all_activities()
            rec.activity_ids = activity_ids.filtered(lambda x: x.user_id.id == rec.user_id.id).ids
            rec.all_activity_ids = activity_ids.filtered(lambda x: x.user_id.id != rec.user_id.id).ids
            # rec.details = (
            #     self.env['ir.ui.view']._render_template(
            #         'whatsapp_connector.template_conversation_panel_activity_summary',
            #         {'activity_ids': rec.activity_ids}
            #     ))
            rec.details = False
            rec.activity_ids_count = len(activity_ids.ids)

    def get_all_activities(self):
        self.ensure_one()
        user_ids = self.env['res.users'].search(
            [('is_chatroom_group', '=', True), ('company_id', '=', self.company_id.id)])
        return self.env['mail.activity'].search([
            ('user_id', 'in', user_ids.ids),
            ('res_model', '=', 'acrux.chat.conversation'),
        ])

    def action_open_view_generic(self):
        self.ensure_one()
        # view_whatsapp_connector_conversation_kanban
        ids = self.get_all_activities().mapped('res_id')
        return {
            'type': 'ir.actions.act_window',
            'name': _('Linked Activities'),
            'res_model': 'acrux.chat.conversation',
            # 'res_model': 'mail.activity',
            # 'view_mode': 'tree,form',
            'view_mode': 'activity',
            'domain': [('id', 'in', ids), ('company_id', '=', self.company_id.id)],
        }

    @api.autovacuum
    def _gc_conversation_pane(self):
        limit_date = fields.Datetime.subtract(fields.Datetime.now(), days=1)
        self.env['acrux.chat.panel'].search([('write_date', '<', limit_date)]).unlink()
