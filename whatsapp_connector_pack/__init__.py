# -*- coding: utf-8 -*-

from odoo.exceptions import UserError


def pre_init_hook(cr):
    msg = 'ENGLISH:\nInside this module you will find a "modules" directory, ' \
          'there are several modules there, use those and it will remove it.\n\n' \
          'ESPAÑOL:\nDentro de este modulo encontrará un directorio "modules", ' \
          'hay varios modulos ahí, utilice esos y este lo elimina.'
    raise UserError(msg)
