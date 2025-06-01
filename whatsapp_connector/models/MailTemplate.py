# -*- coding: utf-8 -*-
from odoo import models, fields, api


class Template(models.Model):
    _inherit = ['mail.template', 'acrux.chat.message.list.relation']
    _name = 'mail.template'

    waba_template_id = fields.One2many('acrux.chat.template.waba', 'mail_template_id',
                                       string='Waba Template')
    button_ids = fields.One2many('acrux.chat.template.button', 'template_id',
                                 string='Whatsapp Buttons')
    is_chatroom_template = fields.Boolean('Is Chatroom', store=True,
                                          compute='_compute_is_chatroom_template')

    def copy(self, default=None):
        default = default or {}
        new_template = super(Template, self).copy(default)
        for button_id in self.button_ids:
            button_id.copy(default={'template_id': new_template.id})
        return new_template

    def get_waba_param(self, res_id):
        params = []
        if len(self) == 0 or not res_id:
            return params
        self.ensure_one()
        for param in self.waba_template_id.param_ids:
            # O15 = '{{%s}}' - O14 <= '${%s}'
            template_value = '{{%s}}' % param.value
            res = self._render_template(template_value, self.model, [res_id], options={'post_process': True})
            params.append(res[res_id])
        return params

    @api.depends('name')
    def _compute_is_chatroom_template(self):
        for record in self:
            if record.name:
                record.is_chatroom_template = 'chatroom' in record.name.lower()
            else:
                record.is_chatroom_template = False

    @api.constrains('chat_list_id', 'button_ids')
    def _constrains_button_list(self):
        super(Template, self)._constrains_button_list()
