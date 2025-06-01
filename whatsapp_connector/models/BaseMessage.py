# -*- coding: utf-8 -*-

from odoo import models, fields


class ModelCommon(models.AbstractModel):
    _name = 'acrux.chat.base.message'
    _description = 'Base Message'

    active = fields.Boolean(default=True)
    text = fields.Text('Message')
    ttype = fields.Selection([('text', 'Text'), ('image', 'Image'), ('audio', 'Audio'),
                              ('video', 'Video'), ('file', 'File'), ('location', 'Location'),
                              ('info', 'Info'), ('sticker', 'Sticker')],
                             string='Type', required=True, default='text')
    res_model = fields.Char('Model', readonly=True)
    res_id = fields.Integer('Id', readonly=True)
