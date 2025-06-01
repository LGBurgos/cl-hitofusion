# -*- coding: utf-8 -*-

from odoo import models, fields, api


class AiInterfaceBase(models.AbstractModel):
    _name = 'acrux.chat.ai.interface.base'
    _description = 'AI Interface Base'

    name = fields.Char(related='ai_config_id.name', store=True, readonly=True, translate=False)
    ai_config_id = fields.Many2one('acrux.chat.ai.config', string='Config',
                                   required=True, ondelete='cascade',
                                   default=lambda self: self.env['acrux.chat.ai.config'].search([], limit=1))
    operation_key = fields.Char(related='ai_config_id.operation_key')
    req_text = fields.Text('Request Text')
    res_text = fields.Text('Response Text')
    info = fields.Char('Info', compute='_compute_hide_req_text')
    hide_req_text = fields.Boolean('Hide Req Text', compute='_compute_hide_req_text')

    @api.onchange('ai_config_id')
    def onchange_conv_ai_config(self):
        for interface in self:
            if interface.ai_config_id:
                interface.req_text = ''
                interface.res_text = ''

    @api.depends('ai_config_id')
    def _compute_hide_req_text(self):
        for interface in self:
            if interface.ai_config_id:
                if interface.ai_config_id.can_edit_request_text():
                    interface.hide_req_text = False
                    interface.info = False
                else:
                    interface.hide_req_text = True
                    interface.info = interface.ai_config_id.get_info_help()
            else:
                interface.hide_req_text = False
                interface.info = False

    def execute_command(self):
        self.ensure_one()
        self.res_text = self.ai_config_id.execute_ai(self.req_text)
