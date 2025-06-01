# -*- coding: utf-8 -*-
import logging
from odoo import models
_logger = logging.getLogger(__name__)


class ProductProduct(models.Model):
    _inherit = 'product.product'

    def read_from_chatroom(self, field_read=None, load='_classic_read'):
        if not field_read:
            field_read = self.env['acrux.chat.conversation'].get_product_fields_to_read()
        return self.sudo().read(fields=field_read, load=load)
