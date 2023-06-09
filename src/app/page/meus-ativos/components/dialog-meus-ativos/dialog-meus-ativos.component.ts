import { TipoAtivo } from './../../../../core/model/Enums';
import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { PerguntasService } from '../../perguntas.service';
import { AtualizarAtivo, CadastrarAtivo } from 'src/app/core/model/Ativo';
import { FinancesService } from 'src/app/core/server/Finances/finances.service';
import { UsuarioService } from 'src/app/core/server/usuario/usuario.service';
import {
  ListarMetaInvestimentoModel,
  MetaInvestimento,
} from 'src/app/core/model/MetaInvestimento';
import { UsuarioLogado } from 'src/app/core/model/Usuario';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-dialog-meus-ativos',
  templateUrl: './dialog-meus-ativos.component.html',
  styleUrls: ['./dialog-meus-ativos.component.scss'],
})
export class DialogMeusAtivosComponent implements OnInit {
  @Output() metaCriada = new EventEmitter();
  title: string = 'Aportar';
  btnTitle: string = 'Cadastrar ativo';
  getId: any;
  progresso: number;
  form: FormGroup;
  formPontos: FormGroup;
  metas: any;
  minDate: Date = new Date();
  items = [];
  color: ThemePalette = 'accent';
  checked: any;
  disabled = false;
  perguntas: any;
  value: any;
  qtdPontos: number = 0;
  recomendacaoPorcentagem: number;
  sugestaoInvestimento: number;
  dadosMeta: ListarMetaInvestimentoModel;
  getIdUser: UsuarioLogado;

  ativos = [
    { value: 3, viewValue: 'Ações' },
    { value: 1, viewValue: 'Fundos Imobiliários' },
    { value: 2, viewValue: 'Renda Fixa' },
  ];

  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    private fb: FormBuilder,
    private serviceFinances: FinancesService,
    private toastr: ToastrService,
    private servicePergunta: PerguntasService,
    private serviceUsuario: UsuarioService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit() {
    this.montaForm();

    this.getIdUser = this.serviceUsuario.getUserLocalStorage();
    this.getMetaId(this.getIdUser.idUsuario);

    if (this.data) {
      this.btnTitle = 'Editar ativo';
      this.value = this.data.tipoAtivo;
      this.form.get('tipoAtivo')?.disable();
      this.form.get('tipoAtivo')?.setValue(this.value);
      this.form.patchValue(this.data);
    }
  }

  getMetaId(id: number) {
    this.spinner.show();
    this.serviceFinances
      .listarMetaInvestimento(id)
      .subscribe({
        next: (res) => {
          this.dadosMeta = res[0];
        },
      })
      .add(() => this.spinner.hide());
  }

  onSelectionChange() {
    this.spinner.show();
    this.serviceUsuario
      .buscarPergunta(this.getIdUser.idUsuario)
      .subscribe({
        next: (res) => {
          this.perguntas = res;

          console.log(this.perguntas);

          if (this.perguntas) {
            this.perguntas = this.perguntas.filter(
              (item: { tipo: number }) => item.tipo == this.value
            );
          }
        },
        error: (e) => {
          console.error(e);
        },
      })
      .add(() => this.spinner.hide());
  }

  onQtdPontosChange(perguntaId: any) {
    if (perguntaId.checked) {
      this.qtdPontos += 1;
      // this.perguntas.forEach((element) => {
      //   if (element == perguntaId) {
      //     element.checked = true;
      //   }
      // });
    } else this.qtdPontos -= 1;
  }

  montaForm() {
    this.form = this.fb.group({
      tipoAtivo: [null, Validators.required],
      nome: [null, Validators.required],
      quantidadeDeAtivo: [null, Validators.required],
      localAlocado: [null, Validators.required],
      valorAtualDoAtivo: [null, Validators.required],
    });
  }

  cadastrarAtivo(): void {
    this.spinner.show();
    const qtdPontos = this.qtdPontos;
    const checked = this.checked.length;

    const percentual = qtdPontos / checked;
    let pontuacao = Math.round(percentual * 10);
    if (this.value == 2) pontuacao = 10;

    const sugestaoInvestimento =
      pontuacao * parseInt(this.form.value.valorAtualDoAtivo);
    const calculaTotal =
      parseInt(this.form.value.valorAtualDoAtivo) *
      parseInt(this.form.value.quantidadeDeAtivo);
    const percentualRecomendado =
      (sugestaoInvestimento / calculaTotal / this.dadosMeta.rendaFixa) * 100;

    const model: CadastrarAtivo = {
      idUsuario: this.getIdUser.idUsuario,
      idMeta: this.dadosMeta.idMeta,
      nome: this.form.value.nome,
      nota: pontuacao,
      recomendacaoPorcentagem: percentualRecomendado,
      sugestaoInvestimento: sugestaoInvestimento,
      tipoAtivo: this.form.value.tipoAtivo,
      localAlocado: this.form.value.localAlocado,
      quantidadeDeAtivo: parseInt(this.form.value.quantidadeDeAtivo),
      valorTotalInvestido: calculaTotal,
      valorAtualDoAtivo: this.form.value.valorAtualDoAtivo,
    };

    this.serviceFinances
      .cadastrarAtivo(model)
      .subscribe({
        next: (res) => {
          this.toastr.success('O ativo foi cadastrado com sucesso!', 'Sucesso');
          this.serviceFinances.filter(res);
          this.dialogRef.close();
        },
        error: (e) => {
          console.error(e);
        },
      })
      .add(() => this.spinner.hide());
  }

  editarMeta(e?: any) {
    this.spinner.show();
    const calculaTotal =
      parseInt(this.form.value.valorAtualDoAtivo) *
      parseInt(this.form.value.quantidadeDeAtivo);
    const model: AtualizarAtivo = {
      idUsuario: this.data.idUsuario,
      idMeta: this.data.idMeta,
      idAtivo: this.data.idAtivo,
      nome: this.form.value.nome,
      localAlocado: this.form.value.localAlocado,
      quantidadeDeAtivo: parseInt(this.form.value.quantidadeDeAtivo),
      valorAtualDoAtivo: this.form.value.valorAtualDoAtivo,
      valorTotalInvestido: calculaTotal,
      nota: this.data.nota,
      recomendacaoPorcentagem: this.data.recomendacaoPorcentagem,
      sugestaoInvestimento: this.data.sugestaoInvestimento,
      tipoAtivo: this.data.tipoAtivo,
    };

    this.serviceFinances
      .atualizarAtivo(model)
      .subscribe({
        next: (res) => {
          this.toastr.success('O ativo foi atualizado com sucesso!', 'Sucesso');
          this.serviceFinances.filter(res);
          this.dialogRef.close();
        },
        error: (e) => {
          console.error(e);
        },
      })
      .add(() => this.spinner.hide());
  }

  verificacaoValid() {
    if (this.form.invalid) {
      this.toastr.warning(
        'Favor preencher todos os campos obrigatorios',
        'Alerta'
      );
      this.form.markAllAsTouched();
      return;
    }
  }

  salvar() {
    if (this.data) this.editarMeta();
    else this.cadastrarAtivo();
  }
}
